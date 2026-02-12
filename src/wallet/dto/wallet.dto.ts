import { LedgerEntryType } from '@interfaces/wallet.interface';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  Min,
  IsString,
  MaxLength,
} from 'class-validator';

export class LedgerQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by asset type id',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  asset_type_id?: number;

  @ApiPropertyOptional({
    description: 'Pagination limit',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Pagination offset',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

class AssetBalanceDto {
  @ApiProperty({ example: 'Gold Coins' })
  asset_type: string;

  @ApiProperty({ example: 100 })
  balance: number;
}

export class WalletBalanceResponseDto {
  @ApiProperty({ example: 123 })
  user_id: number;

  @ApiProperty({ type: [AssetBalanceDto] })
  balances: AssetBalanceDto[];
}

export class LedgerEntryResponseDto {
  @ApiProperty({
    description: 'Ledger entry id (BIGINT)',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: 'Wallet id (BIGINT)',
    example: '10',
  })
  wallet_id: string;

  @ApiProperty({ enum: LedgerEntryType, example: LedgerEntryType.CREDIT })
  type: LedgerEntryType;

  @ApiProperty({ example: 100 })
  amount: number;

  @ApiProperty({ example: 'BONUS' })
  source_type: string;

  @ApiProperty({ example: 'REFERRAL_ABC' })
  reference_id: string;

  @ApiProperty({ example: '2024-01-01T10:00:00Z' })
  created_at: string;

  @ApiPropertyOptional({ example: 'Initial welcome bonus' })
  metadata?: string;
}

export class BaseTransactionDto {
  @ApiProperty({ example: 123 })
  @IsNumber()
  @Type(() => Number)
  user_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  asset_type_id: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Unique key for idempotency',
    example: 'topup-PAY_987654',
  })
  @IsString()
  request_key: string;

  @ApiPropertyOptional({
    description: 'Optional notes or metadata',
    example: 'Refunding for order #123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Metadata is too long (max 500 characters)' })
  metadata?: string;
}

export class WalletTopUpDto extends BaseTransactionDto {
  @ApiProperty({
    description: 'External payment reference',
    example: 'PAY_987654',
  })
  @IsString()
  payment_reference: string;
}

export class WalletBonusDto extends BaseTransactionDto {
  @ApiProperty({
    description: 'Reason for issuing bonus',
    example: 'REFERRAL_BONUS',
  })
  @IsString()
  reason: string;
}

export class WalletSpendDto extends BaseTransactionDto {
  @ApiProperty({
    description: 'Order or transaction reference',
    example: 'ORDER_789',
  })
  @IsString()
  order_reference: string;
}

export class TransactionResponseDto {
  @ApiProperty({ example: 'SUCCESS' })
  status: 'SUCCESS';

  @ApiProperty({ example: 100 })
  amount: number;

  @ApiProperty({ example: 170 })
  balance_after: number;
}
