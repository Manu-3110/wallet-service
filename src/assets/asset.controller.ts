import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { AssetService } from './asset.service';
import { CreateAssetDto, AssetResponseDto } from './dto/asset.dto';

@ApiTags('Assets')
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @ApiSecurity('basic-auth')
  @ApiOperation({ summary: 'Create new asset type' })
  @ApiResponse({ status: 201, type: AssetResponseDto })
  async create(@Body() dto: CreateAssetDto): Promise<AssetResponseDto> {
    const asset = await this.assetService.create(dto);

    return {
      id: asset.id,
      name: asset.name,
      description: asset.description,
      status: asset.status,
      created_at: asset.createdAt.toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  @ApiResponse({ status: 200, type: [AssetResponseDto] })
  async findAll(): Promise<AssetResponseDto[]> {
    const assets = await this.assetService.findAll();

    return assets.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      status: a.status,
      created_at: a.createdAt.toISOString(),
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by id' })
  @ApiResponse({ status: 200, type: AssetResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AssetResponseDto> {
    const a = await this.assetService.findById(id);

    return {
      id: a.id,
      name: a.name,
      description: a.description,
      status: a.status,
      created_at: a.createdAt.toISOString(),
    };
  }
}
