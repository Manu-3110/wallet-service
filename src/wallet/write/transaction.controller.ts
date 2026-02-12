import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  WalletTopUpDto,
  WalletBonusDto,
  WalletSpendDto,
  TransactionResponseDto,
} from '../dto/wallet.dto';
import { TransactionService } from './transaction.service';

@ApiTags('Wallet (Transactions)')
@Controller('wallets/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('topup')
  @ApiOperation({ summary: 'Top-up a user wallet' })
  @ApiResponse({
    status: 201,
    description: 'Top-up successful',
    type: TransactionResponseDto,
  })
  async topUp(@Body() dto: WalletTopUpDto): Promise<TransactionResponseDto> {
    return this.transactionService.topUp(dto);
  }

  @Post('bonus')
  @ApiOperation({ summary: 'Issue bonus to a user wallet' })
  @ApiResponse({
    status: 201,
    description: 'Bonus issued',
    type: TransactionResponseDto,
  })
  async bonus(@Body() dto: WalletBonusDto): Promise<TransactionResponseDto> {
    return this.transactionService.bonus(dto);
  }

  @Post('spend')
  @ApiOperation({ summary: 'Spend from a user wallet' })
  @ApiResponse({
    status: 201,
    description: 'Spend successful',
    type: TransactionResponseDto,
  })
  async spend(@Body() dto: WalletSpendDto): Promise<TransactionResponseDto> {
    return this.transactionService.spend(dto);
  }
}
