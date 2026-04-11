import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { AssetCategory, InvestmentStatus } from 'generated/prisma/client';

export class CreateInvestmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AssetCategory)
  @IsNotEmpty()
  category: AssetCategory;

  @IsNumber()
  @IsNotEmpty()
  principal: number;

  @IsDateString()
  @IsNotEmpty()
  purchaseDate: string; // Use string for DTO, convert to Date in service/controller

  // companyId will be derived from the authenticated user
}

export class UpdateInvestmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(AssetCategory)
  @IsOptional()
  category?: AssetCategory;

  @IsNumber()
  @IsOptional()
  principal?: number;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;
}

export class InvestmentIdParam {
  @IsString()
  @IsNotEmpty()
  investmentId: string;
}

export class UpdateInvestmentStatusDto {
  @IsEnum(InvestmentStatus)
  @IsNotEmpty()
  status: InvestmentStatus;
}
