import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './balance.service';
import {
  LedgerEntryResponseDto,
  LedgerQueryDto,
  WalletBalanceResponseDto,
} from '../dto/wallet.dto';

@ApiTags('Wallet (Balance)')
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':userId/balance')
  @ApiOperation({ summary: 'Get wallet balances for a user' })
  @ApiResponse({
    status: 200,
    description: 'User balances',
    type: WalletBalanceResponseDto,
  })
  async getBalances(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<WalletBalanceResponseDto> {
    const balances = await this.walletService.getUserBalances(userId);
    return { user_id: userId, balances };
  }

  @Get(':userId/ledger')
  @ApiOperation({ summary: 'Get ledger entries for a user' })
  @ApiQuery({ name: 'asset_type_id', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Ledger entries',
    type: LedgerEntryResponseDto,
    isArray: true,
  })
  async getLedger(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: LedgerQueryDto,
  ): Promise<{ wallet_id: string | null; entries: LedgerEntryResponseDto[] }> {
    const entries = await this.walletService.getUserLedger(userId, query);
    const wallet_id = entries.length > 0 ? entries[0].wallet_id : null;
    return { wallet_id, entries };
  }
}
