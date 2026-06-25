import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum, IsDate, Max } from 'class-validator';
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



export class CreateContributionDtoV2{
  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  description?: string;


}


export class ContributionJobDto{
  @IsString()
  @IsNotEmpty()
  status:string;

  @IsString()
  @IsNotEmpty()
  merchant_request_id:string;

  @IsString()
  @IsNotEmpty()
  checkout_request_id:string;

  @IsNumber()
  @IsNotEmpty()
  result_code:number;

  @IsString()
  @IsNotEmpty()
  result_desc:string;


  @IsString()
  @IsNotEmpty()
  timestamp:string

  @IsString()
  @IsNotEmpty()
  mpesa_receipt_number:string


  @IsNumber()
  @IsNotEmpty()
  amount: number
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
