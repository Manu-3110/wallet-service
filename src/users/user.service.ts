import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { USER_MESSAGES } from '@src/constants/messages/user.messages';
import { UniqueConstraintError } from 'sequelize';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async findById(id: number): Promise<User | null> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException(USER_MESSAGES.USER_NOT_FOUND);
    return user;
  }

  async create(params: { name: string; email: string }): Promise<User> {
    const name = params.name.trim();
    const email = params.email.trim().toLowerCase();

    const existing = await this.userModel.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException(USER_MESSAGES.USER_ALREADY_EXISTS);
    }

    try {
      return await this.userModel.create({ name, email } as any);
    } catch (e) {
      if (e instanceof UniqueConstraintError) {
        throw new BadRequestException(USER_MESSAGES.USER_ALREADY_EXISTS);
      }
      throw e;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const user = await this.userModel.findOne({
      where: { email: normalized },
    });
    if (!user) throw new NotFoundException(USER_MESSAGES.USER_NOT_FOUND);
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }
}
