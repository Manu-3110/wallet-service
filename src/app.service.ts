import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthResponseDto } from './app.dto';
import { COMMON_MESSAGES } from './constants/messages/common.messages';

@Injectable()
export class AppService {
  private readonly configService: ConfigService;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    this.configService = configService;
  }

  async getHealthStatus(): Promise<HealthResponseDto> {
    const origin = this.configService.getOrThrow<string>('cors.origin');
    return {
      version: '1.0.0',
      message: COMMON_MESSAGES.SUCCESS,
      database_connection: true,
      origin: origin,
      timestamp: new Date(),
      timezone: process.env.TZ!,
      system: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}
