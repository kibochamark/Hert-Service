import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()

  description: string;
}

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  fiscalYearStartMonth?: Date;

  @IsOptional()
  monthlyContributionDeadline?: number;

  @IsOptional()
  minimumMonthlyContribution?: number;
}

export class CompanyIdParam {
  @IsString()
  @IsNotEmpty()
  companyId: string;
}
