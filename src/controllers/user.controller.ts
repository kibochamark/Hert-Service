import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, UserIdParam } from '../common/validators/user.validators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from 'generated/prisma/client';
import { UsersService } from 'src/domains/users/users.service';

@UseGuards(RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Public() // User creation is public
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Roles(Role.ADMIN) // Only admin can view all users
  @Get()
  async findAllUsers() {
    return this.userService.findAllUsers();
  }

  @Roles(Role.ADMIN, Role.MEMBER) // Admin can view any user, Member can view their own (logic for "their own" would be in service)
  @Get(':userId')
  async findUserById(@Param() params: UserIdParam) {
    return this.userService.findUserById(params.userId);
  }

  @Roles(Role.ADMIN) // Only admin can update users
  @Patch(':userId')
  async updateUser(
    @Param() params: UserIdParam,
    @Body() updateUserDto: Partial<UpdateUserDto>,
  ) {
    return this.userService.updateUser(params.userId, updateUserDto);
  }

  @Roles(Role.ADMIN) // Only admin can delete users
  @Delete(':userId')
  async deleteUser(@Param() params: UserIdParam) {
    return this.userService.deleteUser(params.userId);
  }

  @Roles(Role.ADMIN) // Only admin can view users by company
  @Get('company/:companyId')
  async findUsersByCompanyId(@Param('companyId') companyId: string) { 
    return this.userService.findUsersByCompanyId(companyId);
  }

  @Roles(Role.ADMIN) // Only admin can create member accounts for users
  @Post(':userId/company/:companyId/member-account')
  async createMemberAccountForUser(
    @Param('userId') userId: string,
    @Param('companyId') companyId: string,
  ) {
    return this.userService.createMemberAccountForUser(userId, companyId);
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Get(':userId/member-account')
  async getMemberAccount(@Param('userId') userId: string) {
    return this.userService.getMemberAccountByUserId(userId);
  }
}
