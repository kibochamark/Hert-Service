import { IsString, IsOptional, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class LogRevenueDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  dateReceived: string; // Use string for DTO, convert to Date in service/controller

  @IsString()
  @IsNotEmpty()
  investmentId: string;
}

export class LogExpenseDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  transactionDate: string; // Use string for DTO, convert to Date in service/controller
}
