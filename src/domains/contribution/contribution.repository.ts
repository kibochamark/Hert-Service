import { Injectable, Logger } from "@nestjs/common";
import { AccountType, ApprovalStatus } from "generated/prisma/enums";
import { PrismaService } from "src/prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";



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
export class ContributionRepository {
  // This is a placeholder for the actual implementation of the ContributionRepository.
  // In a real application, this would interact with the database to manage contributions.

  private readonly logger = new Logger(ContributionRepository.name);
  
  constructor(private readonly prisma: PrismaService, private readonly ledgerService: LedgerService) {}
  

  async createContribution(contributionData: ContributionData) {
    try {
        const contribution = await this.prisma.$transaction(async(tx)=>{
            const contribution = await tx.contributionRequest.create({
                data: contributionData
            });

            // Add audit log
            await tx.auditLog.create({
                data: {
                    action: 'CREATE',
                    entityName: 'Contribution',
                    entityId: contribution.id,
                    newValue: JSON.stringify(contribution),
                    companyId: contributionData.companyId
                }
            });

            this.logger.log(`Created contribution with transactionRef: ${contributionData.transactionRef} for user: ${contributionData.userId} in company: ${contributionData.companyId}`);

            return contribution;
        })

        return contribution;
        
    } catch (error) {
        this.logger.error('Error creating contribution', error);
        throw error;
    }
  }

  async findContributionsByUser(userId: string) {
    try {
        this.logger.log(`Fetching contributions for user: ${userId}`);
        const contributions = await this.prisma.contributionRequest.findMany({
            where: { userId },
        });
        this.logger.log(`Found ${contributions.length} contributions for user: ${userId}`);
        return contributions;
    } catch (error) {
        this.logger.error(`Error fetching contributions for user: ${userId}`, error);
        throw error;
    }
  }

  async findContributionsByCompany(companyId: string) {
    try {
        this.logger.log(`Fetching contributions for company: ${companyId}`);
        const contributions = await this.prisma.contributionRequest.findMany({
            where: { companyId },
        });
        this.logger.log(`Found ${contributions.length} contributions for company: ${companyId}`);
        return contributions;
    } catch (error) {
        this.logger.error(`Error fetching contributions for company: ${companyId}`, error);
        throw error;
    }
    
  }

  async approveContribution(contributionId: string, data:{
      processedBy: string,
    adminNotes?: string
    approvalStatus: ApprovalStatus
  } ) {
    try {
        const contribution = await this.prisma.$transaction(async(tx)=>{
            // 1. Update the contribution request status to 'PROCESSED'
            const updatedContribution = await tx.contributionRequest.update({
                where: { id: contributionId },
                data: {
                    status: data.approvalStatus,
                    processedAt: new Date(),
                    processedBy: data.processedBy,
                    adminNotes: data.adminNotes,
                },
            });

            // 2. If approved, update the member's account balance
            if (data.approvalStatus === ApprovalStatus.APPROVED) {
                // money moves from equity to company contribution pool (liability) and then to member account (asset)
                // fetch the above accoounts

                const [companyContributionPoolAccount, existingMemberAccount] = await Promise.all([
                    tx.memberAccount.findFirst({
                        where: {
                            companyId: updatedContribution.companyId,
                            type: AccountType.ASSET
                        },
                    }),
                    tx.memberAccount.findFirst({
                        where: {
                            userId: updatedContribution.userId,
                            companyId: updatedContribution.companyId,
                            type: AccountType.MEMBER_EQUITY
                        },
                    }),
                ]);

                this.logger.log(`Fetched company contribution pool account: ${companyContributionPoolAccount?.id} and member equity account: ${existingMemberAccount?.id} for contribution approval with ID: ${contributionId}`);

                const memberAccount = existingMemberAccount ?? await tx.memberAccount.create({
                    data: {
                        name: 'Member Equity Account',
                        type: AccountType.MEMBER_EQUITY,
                        companyId: updatedContribution.companyId,
                        userId: updatedContribution.userId,
                    },
                });

                this.logger.log(
                    existingMemberAccount
                        ? `Found member equity account: ${memberAccount.id}`
                        : `Created member equity account: ${memberAccount.id} for user: ${updatedContribution.userId}`
                );

                await this.ledgerService.executeTransfer({
                    debitAccountId: companyContributionPoolAccount?.id as string, // This should be the actual account ID for the company's contribution pool
                    creditAccountId: memberAccount?.id as string, // This should be the actual member account ID
                    amount: updatedContribution.amount.toNumber(),
                    description: `Approved contribution with transactionRef: ${updatedContribution.transactionRef}`,
                    userId: updatedContribution.userId,
                    companyId: updatedContribution.companyId,
                    referenceId: updatedContribution.id,
                });
            }
           

            
        })

        return contribution;
        
    } catch (error) {
        this.logger.error(`Error processing contribution with ID: ${contributionId}`, error);
        throw error;
    }
  } 

    async getContributionById(contributionId: string) {
        try {
            this.logger.log(`Fetching contribution with ID: ${contributionId}`);
            const contribution = await this.prisma.contributionRequest.findUnique({
                where: { id: contributionId },
            });
            if (!contribution) {
                this.logger.warn(`Contribution with ID: ${contributionId} not found`);
            }
            return contribution;
        } catch (error) {
            this.logger.error(`Error fetching contribution with ID: ${contributionId}`, error);
            throw error;
        }
    }

    async updateContribution(contributionId: string, data: Partial<ContributionData>) {
        try {
            this.logger.log(`Updating contribution with ID: ${contributionId}`);
            const contribution = await this.prisma.contributionRequest.update({
                where: { id: contributionId },
                data,
            });
            this.logger.log(`Successfully updated contribution with ID: ${contributionId}`);
            return contribution;
        } catch (error) {
            this.logger.error(`Error updating contribution with ID: ${contributionId}`, error);
            throw error;
        }
    }

    async getMemberSummaryByCompany(companyId: string) {
        try {
            this.logger.log(`Fetching member contribution summary for company: ${companyId}`);

            const users = await this.prisma.user.findMany({
                where: { companyId },
                include: {
                    memberAccount: { select: { balance: true } },
                    contributionRequests: {
                        where: { companyId },
                        select: { status: true, createdAt: true },
                    },
                },
            });

            // Total of all MEMBER_EQUITY balances for equity % calculation
            const companyTotal = users.reduce(
                (sum, u) => sum + (u.memberAccount?.balance.toNumber() ?? 0),
                0,
            );

            const summary = users.map(user => {
                const balance = user.memberAccount?.balance.toNumber() ?? 0;
                const approved = user.contributionRequests.filter(c => c.status === ApprovalStatus.APPROVED);
                const pending = user.contributionRequests.filter(c => c.status === ApprovalStatus.PENDING);
                const lastApproved = approved.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                )[0];

                return {
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    targetMonthlyContribution: user.targetMonthlyContribution.toNumber(),
                    totalContributed: balance,
                    approvedContributions: approved.length,
                    pendingContributions: pending.length,
                    lastContributionDate: lastApproved?.createdAt ?? null,
                    equityPercentage: companyTotal > 0
                        ? parseFloat(((balance / companyTotal) * 100).toFixed(2))
                        : 0,
                };
            });

            this.logger.log(`Member summary built for ${users.length} members in company: ${companyId}`);
            return summary;
        } catch (error) {
            this.logger.error(`Error fetching member summary for company: ${companyId}`, error);
            throw error;
        }
    }

    async deleteContribution(contributionId: string) {
        try {
            this.logger.log(`Deleting contribution with ID: ${contributionId}`);
            await this.prisma.contributionRequest.delete({ where: { id: contributionId } });
            this.logger.log(`Successfully deleted contribution with ID: ${contributionId}`);
        } catch (error) {
            this.logger.error(`Error deleting contribution with ID
    : ${contributionId}`, error);
            throw error;
        }   
    }
}