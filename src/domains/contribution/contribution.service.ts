/// <reference types="multer" />
import { Injectable, Logger } from '@nestjs/common';
import { ContributionRepository } from './contribution.repository';
import { ApprovalStatus } from 'generated/prisma/browser';
import { S3Service } from 'src/globalservices/s3/s3.service';

export interface ContributionData {
    evidenceUrl?: string;
    evidencePublicId?: string;
    amount: number;
    transactionRef: string;
    userId: string;
    companyId: string;
    adminNotes?: string;
    processedAt?: Date;
    processedBy?: string;
}

@Injectable()
export class ContributionService {
    private readonly logger = new Logger(ContributionService.name);
    constructor(private readonly contributionRepository: ContributionRepository,
        private readonly s3Service: S3Service
    ) {}

    async createContribution(contributionData: ContributionData, file?: Express.Multer.File) {
        try{
            if (file) {
                this.logger.log(`Uploading file for contribution with transactionRef: ${contributionData.transactionRef}`);
                const uploadResult = await this.s3Service.uploadFile(file, 'contributions');
                contributionData.evidenceUrl = uploadResult.secure_url;
                contributionData.evidencePublicId = uploadResult.public_id;
                this.logger.log(`File uploaded successfully for contribution with transactionRef: ${contributionData.transactionRef}`);
            } else {
                this.logger.log(`No file provided for contribution with transactionRef: ${contributionData.transactionRef}`);
            }

            this.logger.log(`Creating contribution with transactionRef: ${contributionData.transactionRef} for user: ${contributionData.userId} in company: ${contributionData.companyId}`);
            return this.contributionRepository.createContribution(contributionData);
        
        }catch(error){ 
            this.logger.error(`Error creating contribution with transactionRef: ${contributionData.transactionRef} for user: ${contributionData.userId} in company: ${contributionData.companyId}`, error.stack);
            await this.s3Service.deleteFile(contributionData.evidencePublicId!);
            throw error;

        }
    }
        

    async getContributionById(contributionId: string) {
        // Implement logic to retrieve a contribution by its ID
        this.logger.log(`Fetching contribution with ID: ${contributionId}`);
        return this.contributionRepository.getContributionById(contributionId);
    }
    async findContributionsByUser(userId: string) {
        this.logger.log(`Fetching contributions for user: ${userId}`);
        return this.contributionRepository.findContributionsByUser(userId);
    }

    async findContributionsByCompany(companyId: string) {
        this.logger.log(`Fetching contributions for company: ${companyId}`);
        return this.contributionRepository.findContributionsByCompany(companyId);

    }

    async updateContribution(contributionId: string, data: Partial<ContributionData>) {
        this.logger.log(`Updating contribution with ID: ${contributionId}`);
        return this.contributionRepository.updateContribution(contributionId, data);
    }

    async deleteContribution(contributionId: string) {
        this.logger.log(`Deleting contribution with ID: ${contributionId}`);
        return this.contributionRepository.deleteContribution(contributionId);
    }   
    

    async approveContribution(contributionId: string, data:{
        processedBy: string,
        adminNotes?: string,
        approvalStatus: ApprovalStatus
    }) {
        this.logger.log(`Approving contribution with ID: ${contributionId} by user: ${data.processedBy}`);
        return this.contributionRepository.approveContribution(contributionId, data);
    }

    async getMemberSummaryByCompany(companyId: string) {
        this.logger.log(`Fetching member summary for company: ${companyId}`);
        return this.contributionRepository.getMemberSummaryByCompany(companyId);
    }
}
