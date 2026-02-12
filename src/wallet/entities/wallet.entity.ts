import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { LedgerEntry } from './ledger.entity';
import { User } from '@src/users/entities/user.entity';
import { Asset } from '@src/assets/entities/asset.entity';

@Table({ tableName: 'wallets', timestamps: false })
export class Wallet extends Model<Wallet> {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.BIGINT, allowNull: true, field: 'user_id' })
  declare userId: string | null;

  @ForeignKey(() => Asset)
  @Column({ type: DataType.BIGINT, allowNull: false, field: 'asset_type_id' })
  declare assetTypeId: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_system',
  })
  declare isSystem: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare balance: number;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;

  @BelongsTo(() => User)
  declare user?: User;

  @BelongsTo(() => Asset)
  declare assetType: Asset;

  @HasMany(() => LedgerEntry)
  declare ledgerEntries: LedgerEntry[];
}
