import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Wallet } from './entities/wallet.entity';
import { LedgerEntry } from './entities/ledger.entity';
import { WalletService } from './read/balance.service';
import { TransactionService } from './write/transaction.service';
import { WalletController } from './read/balance.controller';
import { TransactionController } from './write/transaction.controller';
import { User } from '@src/users/entities/user.entity';
import { Asset } from '@src/assets/entities/asset.entity';

@Module({
  imports: [SequelizeModule.forFeature([Wallet, LedgerEntry, Asset, User])],
  providers: [WalletService, TransactionService],
  controllers: [WalletController, TransactionController],
  exports: [WalletService, TransactionService],
})
export class WalletModule {}
