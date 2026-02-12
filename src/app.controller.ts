import { Controller, Get, HttpStatus, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from '@src/app.service';

import { ConfigService } from '@nestjs/config';
import { HealthResponseDto } from './app.dto';

@Controller()
@ApiTags('App')
export class AppController {
  private readonly appService: AppService;

  constructor(
    appService: AppService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    this.appService = appService;
  }

  @Get('/health')
  @ApiOperation({ summary: 'Check the health status of the application' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successful response',
    type: HealthResponseDto,
  })
  getHealthStatus(): Promise<HealthResponseDto> {
    return this.appService.getHealthStatus();
  }
}
