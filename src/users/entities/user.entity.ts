import { Wallet } from '@src/wallet/entities/wallet.entity';
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  HasMany,
} from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: false,
})
export class User extends Model<User> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;

  @HasMany(() => Wallet)
  declare wallets: Wallet[];
}
