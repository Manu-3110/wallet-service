import { ApiProperty } from '@nestjs/swagger';
import { COMMON_MESSAGES } from './constants/messages/common.messages';

export class HealthResponseDto {
  @ApiProperty({ example: '1.0.0', description: 'API version' })
  version: string;

  @ApiProperty({
    example: COMMON_MESSAGES.SUCCESS,
    description: 'Status message',
  })
  message: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the database is connected',
  })
  database_connection: boolean;

  @ApiProperty({
    example: 'https://myapp.com',
    description: 'Origin of the application',
  })
  origin: string;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Date Time of the application',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Timezine of the application',
  })
  timezone: string;

  @ApiProperty({
    description: 'System',
  })
  system: string;
}
