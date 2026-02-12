import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  HasMany,
} from 'sequelize-typescript';
import { StatusEnum } from '@interfaces/wallet.interface';
import { Wallet } from '@src/wallet/entities/wallet.entity';

@Table({
  tableName: 'assets',
  timestamps: false,
})
export class Asset extends Model<Asset> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string;

  @Column({
    type: DataType.ENUM(...Object.values(StatusEnum)),
    allowNull: false,
    defaultValue: StatusEnum.INACTIVE,
  })
  declare status: StatusEnum;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;

  @HasMany(() => Wallet)
  declare wallets: Wallet[];
}
