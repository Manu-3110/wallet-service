import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'Manu Bhargav' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'manu@example.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  @IsNotEmpty()
  email: string;
}

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Manu Bhargav' })
  name: string;

  @ApiProperty({ example: 'manu@example.com' })
  email: string;

  @ApiProperty({ example: '2026-02-11T10:00:00.000Z' })
  createdAt: Date;
}

export class UserQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({ example: 'manu@example.com' })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  @IsEmail()
  email?: string;
}
