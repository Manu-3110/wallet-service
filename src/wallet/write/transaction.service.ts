import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Wallet } from '../entities/wallet.entity';
import { LedgerEntry } from '../entities/ledger.entity';
import {
  WalletTopUpDto,
  WalletBonusDto,
  WalletSpendDto,
  TransactionResponseDto,
} from '../dto/wallet.dto';
import { Op, Transaction, UniqueConstraintError } from 'sequelize';
import { randomUUID } from 'crypto';
import {
  LedgerEntryType,
  StatusEnum,
  TransactionType,
} from '@interfaces/wallet.interface';
import { Asset } from '@src/assets/entities/asset.entity';
import { User } from '@src/users/entities/user.entity';
import { USER_MESSAGES } from '@src/constants/messages/user.messages';
import { WALLET_MESSAGES } from '@src/constants/messages/wallet.messages';
import { ASSET_MESSAGES } from '@src/constants/messages/asset.messages';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectModel(Wallet) private readonly walletRepository: typeof Wallet,
    @InjectModel(Asset) private readonly assetRepository: typeof Asset,
    @InjectModel(User) private readonly userRepository: typeof User,
    @InjectModel(LedgerEntry)
    private readonly ledgerRepository: typeof LedgerEntry,
    private readonly sequelize: Sequelize,
  ) {}

  async topUp(dto: WalletTopUpDto): Promise<TransactionResponseDto> {
    const uuid = randomUUID();
    return this.withRetry(() =>
      this.performTransaction(
        dto,
        LedgerEntryType.CREDIT,
        TransactionType.TOP_UP,
        dto.payment_reference,
        uuid,
        dto.metadata,
      ),
    );
  }

  async bonus(dto: WalletBonusDto): Promise<TransactionResponseDto> {
    const uuid = randomUUID();
    return this.withRetry(() =>
      this.performTransaction(
        dto,
        LedgerEntryType.CREDIT,
        TransactionType.BONUS,
        dto.reason,
        uuid,
        dto.metadata,
      ),
    );
  }

  async spend(dto: WalletSpendDto): Promise<TransactionResponseDto> {
    const uuid = randomUUID();
    return this.withRetry(() =>
      this.performTransaction(
        dto,
        LedgerEntryType.DEBIT,
        TransactionType.SPEND,
        dto.order_reference,
        uuid,
        dto.metadata,
      ),
    );
  }

  private isRetryableDbError(err: any): boolean {
    const code = err?.parent?.code ?? err?.original?.code ?? err?.code;
    return code === '40P01' || code === '40001';
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await fn();
      } catch (err) {
        attempt++;

        if (attempt < maxAttempts && this.isRetryableDbError(err)) {
          const backoffMs = 25 * attempt;

          this.logger.warn(
            `Retrying transaction due to transient DB error (attempt ${
              attempt + 1
            }/${maxAttempts}) after ${backoffMs}ms`,
          );

          await this.sleep(backoffMs);
          continue;
        }

        throw err;
      }
    }
  }

  private async getOrCreateUserWalletLocked(
    dto: WalletTopUpDto | WalletBonusDto | WalletSpendDto,
    t: Transaction,
  ): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: {
        userId: dto.user_id,
        assetTypeId: dto.asset_type_id,
        isSystem: false,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (wallet) return wallet;

    try {
      await this.walletRepository.create(
        {
          userId: dto.user_id,
          assetTypeId: dto.asset_type_id,
          isSystem: false,
          balance: 0,
        } as any,
        { transaction: t },
      );
    } catch (e) {
      if (!(e instanceof UniqueConstraintError)) throw e;
    }

    wallet = await this.walletRepository.findOne({
      where: {
        userId: dto.user_id,
        assetTypeId: dto.asset_type_id,
        isSystem: false,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!wallet) throw new NotFoundException(WALLET_MESSAGES.WALLET_NOT_FOUND);

    return wallet;
  }

  private async checkIdempotent(walletId: string, key: string, t: Transaction) {
    return this.ledgerRepository.findOne({
      where: { walletId, requestKey: key },
      transaction: t,
      lock: t.LOCK.KEY_SHARE,
    });
  }

  private async insertLedgerPair(
    userWallet: Wallet,
    systemWallet: Wallet,
    data: {
      uuid: string;
      amt: number;
      userType: LedgerEntryType;
      systemType: LedgerEntryType;
      sourceType: string;
      referenceId: string;
      requestKey: string;
      metadata?: string;
    },
    t: Transaction,
  ) {
    await this.ledgerRepository.bulkCreate(
      [
        {
          walletId: userWallet.id,
          uuid: data.uuid,
          amount: data.amt,
          type: data.userType,
          sourceType: data.sourceType,
          referenceId: data.referenceId,
          requestKey: data.requestKey,
          metadata: data.metadata,
        },
        {
          walletId: systemWallet.id,
          uuid: data.uuid,
          amount: data.amt,
          type: data.systemType,
          sourceType: data.sourceType,
          referenceId: data.referenceId,
          requestKey: data.requestKey,
          metadata: data.metadata,
        },
      ] as any,
      { transaction: t },
    );
  }

  private async performTransaction(
    dto: WalletTopUpDto | WalletBonusDto | WalletSpendDto,
    type: LedgerEntryType,
    sourceType: string,
    referenceId: string,
    uuid: string,
    metadata?: string,
  ): Promise<TransactionResponseDto> {
    return this.sequelize.transaction(async (t: Transaction) => {
      const amt = Math.trunc(Number(dto.amount));
      if (!Number.isFinite(amt) || amt <= 0) {
        throw new BadRequestException(WALLET_MESSAGES.INVALID_AMOUNT);
      }

      const asset = await this.assetRepository.findByPk(dto.asset_type_id, {
        transaction: t,
        lock: t.LOCK.SHARE,
      });

      if (!asset) throw new NotFoundException(ASSET_MESSAGES.ASSET_NOT_FOUND);
      if (asset.status !== StatusEnum.ACTIVE) {
        throw new BadRequestException(ASSET_MESSAGES.ASSET_INACTIVE);
      }

      const user = await this.userRepository.findByPk(dto.user_id, {
        transaction: t,
        lock: t.LOCK.SHARE,
      });

      if (!user) {
        throw new NotFoundException(USER_MESSAGES.USER_NOT_FOUND);
      }

      const systemWallet = await this.walletRepository.findOne({
        where: { assetTypeId: dto.asset_type_id, isSystem: true },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!systemWallet)
        throw new NotFoundException(WALLET_MESSAGES.SYSTEM_WALLET_NOT_FOUND);

      const userWallet = await this.getOrCreateUserWalletLocked(dto, t);

      const userEntryType = type;
      const systemEntryType =
        type === LedgerEntryType.CREDIT
          ? LedgerEntryType.DEBIT
          : LedgerEntryType.CREDIT;

      const existing = await this.checkIdempotent(
        userWallet.id,
        dto.request_key,
        t,
      );

      if (existing) {
        this.logger.warn(
          `Duplicate request detected for key: ${dto.request_key}. Returning cached result.`,
        );
        const freshUserWallet = await this.walletRepository.findByPk(
          userWallet.id,
          { transaction: t, lock: t.LOCK.UPDATE },
        );

        return {
          status: 'SUCCESS',
          amount: existing.amount,
          balance_after: Number(freshUserWallet?.balance ?? 0),
        };
      }

      if (userEntryType === LedgerEntryType.DEBIT) {
        if (Number(userWallet.balance) < amt) {
          throw new BadRequestException(WALLET_MESSAGES.INSUFFICIENT_BALANCE);
        }
      }

      try {
        await this.insertLedgerPair(
          userWallet,
          systemWallet,
          {
            uuid,
            amt,
            userType: userEntryType,
            systemType: systemEntryType,
            sourceType,
            referenceId,
            requestKey: dto.request_key,
            metadata,
          },
          t,
        );
      } catch (e) {
        if (e instanceof UniqueConstraintError) {
          const freshUserWallet = await this.walletRepository.findByPk(
            userWallet.id,
            { transaction: t, lock: t.LOCK.UPDATE },
          );

          const already = await this.ledgerRepository.findOne({
            where: {
              walletId: userWallet.id,
              requestKey: dto.request_key,
            },
            transaction: t,
          });

          return {
            status: 'SUCCESS',
            amount: already?.amount ?? amt,
            balance_after: Number(freshUserWallet?.balance ?? 0),
          };
        }
        throw e;
      }

      if (userEntryType === LedgerEntryType.CREDIT) {
        await this.walletRepository.update(
          { balance: this.sequelize.literal(`balance + ${amt}`) as any },
          { where: { id: userWallet.id }, transaction: t },
        );
      } else {
        const [count] = await this.walletRepository.update(
          { balance: this.sequelize.literal(`balance - ${amt}`) as any },
          {
            where: { id: userWallet.id, balance: { [Op.gte]: amt } },
            transaction: t,
          },
        );
        if (count === 0)
          throw new BadRequestException(WALLET_MESSAGES.INSUFFICIENT_BALANCE);
      }

      if (systemEntryType === LedgerEntryType.CREDIT) {
        await this.walletRepository.update(
          { balance: this.sequelize.literal(`balance + ${amt}`) as any },
          { where: { id: systemWallet.id }, transaction: t },
        );
      } else {
        await this.walletRepository.update(
          { balance: this.sequelize.literal(`balance - ${amt}`) as any },
          { where: { id: systemWallet.id }, transaction: t },
        );
      }

      const freshUserWallet = await this.walletRepository.findByPk(
        userWallet.id,
        {
          transaction: t,
          lock: t.LOCK.UPDATE,
        },
      );

      return {
        status: 'SUCCESS',
        amount: amt,
        balance_after: Number(freshUserWallet?.balance ?? 0),
      };
    });
  }
}
