import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LedgerQueryDto, LedgerEntryResponseDto } from '../dto/wallet.dto';
import { Wallet } from '../entities/wallet.entity';
import { LedgerEntry } from '../entities/ledger.entity';
import { LedgerEntryType } from '@interfaces/wallet.interface';
import { User } from '@src/users/entities/user.entity';
import { WALLET_MESSAGES } from '@src/constants/messages/wallet.messages';
import { USER_MESSAGES } from '@src/constants/messages/user.messages';
import { Asset } from '@src/assets/entities/asset.entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectModel(Wallet) private readonly walletRepository: typeof Wallet,
    @InjectModel(User)
    private readonly userRepository: typeof User,
    @InjectModel(LedgerEntry)
    private readonly ledgerRepository: typeof LedgerEntry,
    @InjectModel(Asset) private readonly assetRepository: typeof Asset,
  ) {}

  async getUserBalances(userId: number) {
    try {
      const user = await this.userRepository.findByPk(userId);
      if (!user) {
        throw new NotFoundException(USER_MESSAGES.USER_NOT_FOUND);
      }
      const wallets = await this.walletRepository.findAll({
        where: { userId },
        include: [{ model: this.assetRepository, attributes: ['name'] }],
      });

      if (!wallets.length) {
        throw new NotFoundException(WALLET_MESSAGES.WALLET_NOT_FOUND);
      }

      return wallets.map((wallet) => ({
        asset_type: wallet.assetType?.name ?? 'UNKNOWN',
        balance: Number(wallet.balance),
      }));
    } catch (error) {
      this.logger.error(WALLET_MESSAGES.FAILED_TO_FETCH_BALANCE, error);
      throw error;
    }
  }

  async getUserLedger(
    userId: number,
    query: LedgerQueryDto,
  ): Promise<LedgerEntryResponseDto[]> {
    const { asset_type_id, limit = 20, offset = 0 } = query;

    try {
      const wallet = await this.walletRepository.findOne({
        where: {
          userId,
          ...(asset_type_id ? { assetTypeId: asset_type_id } : {}),
        },
      });

      if (!wallet)
        throw new NotFoundException(WALLET_MESSAGES.WALLET_NOT_FOUND);

      const entries = await this.ledgerRepository.findAll({
        where: { walletId: wallet.id },
        order: [['createdAt', 'ASC']],
        limit,
        offset,
        raw: true,
      });

      return entries.map((entry) => ({
        id: String(entry.id),
        wallet_id: entry.walletId,
        type:
          entry.type === 'CREDIT'
            ? LedgerEntryType.CREDIT
            : LedgerEntryType.DEBIT,
        amount: entry.amount,
        source_type: entry.sourceType,
        reference_id: entry.referenceId,
        metadata: entry.metadata,
        created_at: entry.createdAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error(WALLET_MESSAGES.FAILED_TO_FETCH_BALANCE, error);
      throw error;
    }
  }
}
