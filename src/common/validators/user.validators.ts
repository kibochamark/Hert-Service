import { IsString, IsOptional, IsNotEmpty, IsEmail, IsEnum, IsNumber } from 'class-validator';
import { Role } from 'generated/prisma/client';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.MEMBER;

  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsNumber()
  @IsOptional()
  targetMonthlyContribution?: number;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsNumber()
  @IsOptional()
  targetMonthlyContribution?: number;
}

export class UserIdParam {
  @IsString()
  @IsNotEmpty()
  userId: string;
}