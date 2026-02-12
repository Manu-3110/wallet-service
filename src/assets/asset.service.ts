import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Asset } from '@src/assets/entities/asset.entity';
import { CreateAssetDto } from './dto/asset.dto';
import { UniqueConstraintError } from 'sequelize';
import { StatusEnum } from '@interfaces/wallet.interface';
import { ASSET_MESSAGES } from '@src/constants/messages/asset.messages';

@Injectable()
export class AssetService {
  constructor(
    @InjectModel(Asset)
    private readonly assetRepository: typeof Asset,
  ) {}

  async create(dto: CreateAssetDto): Promise<Asset> {
    try {
      return await this.assetRepository.create(dto as any);
    } catch (e) {
      if (e instanceof UniqueConstraintError) {
        throw new ConflictException(ASSET_MESSAGES.ASSET_ALREADY_EXISTS);
      }
      throw e;
    }
  }

  async findAll(): Promise<Asset[]> {
    return this.assetRepository.findAll({
      where: { status: StatusEnum.ACTIVE },
      order: [['id', 'ASC']],
    });
  }

  async findById(id: number): Promise<Asset> {
    const asset = await this.assetRepository.findByPk(id);
    if (!asset) throw new NotFoundException(ASSET_MESSAGES.ASSET_NOT_FOUND);
    return asset;
  }
}
