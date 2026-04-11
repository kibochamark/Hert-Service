import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum, IsDate } from 'class-validator';
import { ApprovalStatus } from 'generated/prisma/enums';

export class CreateContributionDto {
  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  transactionRef: string;

  @IsString()
  @IsOptional()
  evidenceUrl?: string;

  @IsString()
  @IsOptional()
  evidencePublicId?: string;

  @IsDate()
  @IsOptional()
  processedAt?: Date; // This will be set when the contribution is approved/rejected
}

export class ApproveContributionDto {
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  approvalStatus: ApprovalStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

export class UpdateContributionDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  transactionRef?: string;

  @IsString()
  @IsOptional()
  evidenceUrl?: string;

  @IsString()
  @IsOptional()
  evidencePublicId?: string;
}

export class ContributionIdParam {
  @IsString()
  @IsNotEmpty()
  contributionId: string;
}
