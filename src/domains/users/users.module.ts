import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserController } from 'src/controllers/user.controller';
import { UsersRepository } from './users.repository';

@Module({
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
  controllers:[UserController]
})
export class UsersModule {}
