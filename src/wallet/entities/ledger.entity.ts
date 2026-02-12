import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Wallet } from './wallet.entity';
import { LedgerEntryType } from '@interfaces/wallet.interface';

@Table({
  tableName: 'ledger_entries',
  timestamps: false,
  indexes: [{ unique: true, fields: ['wallet_id', 'request_key'] }],
})
export class LedgerEntry extends Model<LedgerEntry> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @ForeignKey(() => Wallet)
  @Column({ type: DataType.BIGINT, allowNull: false, field: 'wallet_id' })
  declare walletId: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare uuid: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare amount: number;

  @Column({
    type: DataType.ENUM(...Object.values(LedgerEntryType)),
    allowNull: false,
  })
  declare type: LedgerEntryType;

  @Column({ type: DataType.STRING, allowNull: false, field: 'source_type' })
  declare sourceType: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'reference_id' })
  declare referenceId: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'request_key' })
  declare requestKey: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare metadata: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;

  @BelongsTo(() => Wallet)
  declare wallet: Wallet;
}
