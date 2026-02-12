import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { StatusEnum } from '@interfaces/wallet.interface';

export class CreateAssetDto {
  @ApiProperty({ example: 'Gold Coins' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional({ example: 'Primary in-app currency' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: StatusEnum,
    example: StatusEnum.ACTIVE,
    default: StatusEnum.ACTIVE,
  })
  @IsEnum(StatusEnum)
  status: StatusEnum;
}

export class AssetResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Gold Coins' })
  name: string;

  @ApiProperty({ example: 'Primary in-app currency' })
  description: string;

  @ApiProperty({ enum: StatusEnum })
  status: StatusEnum;

  @ApiProperty({ example: '2026-02-12T10:00:00Z' })
  created_at: string;
}
