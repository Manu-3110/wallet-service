import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './user.service';
import { CreateUserDto, UserQueryDto, UserResponseDto } from './dto/users.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (no auth — assignment setup)' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users OR filter by id/email' })
  @ApiResponse({
    status: 200,
    description: 'Users list or specific user found',
    type: [UserResponseDto],
  })
  async find(@Query() query: UserQueryDto) {
    if (query.id) {
      return this.usersService.findById(query.id);
    }

    if (query.email) {
      return this.usersService.findByEmail(query.email);
    }
    return this.usersService.findAll();
  }
}
