import { Processor, WorkerHost } from "@nestjs/bullmq";
import { ContributionRepository } from "./contribution.repository";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Redis } from 'ioredis';
import { ConfigService } from "@nestjs/config";
import { ContributionJobDto } from "src/common/validators/contribution.validators";
import { Job } from "bullmq";
import { PrismaService } from "src/prisma/prisma.service";


@Processor('process-contribution-job')
@Injectable()
export class ContributionProcessor extends WorkerHost{
    private readonly logger = new Logger(ContributionProcessor.name)


    constructor(private contributionRepo:ContributionRepository,
        private configService:ConfigService,
        private prisma:PrismaService,
        @Inject('REDIS_PUBLISHER')
        private readonly publisher: Redis,
    ){
        super()

    
    }


    async process(job: Job<ContributionJobDto, any, string>): Promise<any> {
        this.logger.log(
            `Processing contribution job ${job.id} for ${job.data.checkout_request_id}`,
        );

        const contData = job.data;
        const channelName = `contribution:${job.data.checkout_request_id}`;

        try {
            // Handle failed/cancelled payments
            if (contData.status.toLowerCase() !== 'completed') {
                this.logger.log('Processing failed transaction');

                const transaction = await this.prisma.transactionsTracker.update({
                    where: {
                        checkoutRequestId: contData.checkout_request_id,
                    },
                    data: {
                        status:
                            contData.status.toLowerCase() === 'cancelled'
                                ? 'CANCELLED'
                                : contData.status.toLowerCase() === 'completed'
                                    ? 'COMPLETED'
                                    : 'FAILED',
                    },
                });

                await this.publisher.publish(
                    channelName,
                    JSON.stringify({
                        type: 'payment_failed',
                        error: contData.result_desc,
                    }),
                );

                return transaction;
            }

            this.logger.log('Processing completed transaction');

            const result = await this.prisma.$transaction(
                async (tx) => {
                    const userInfo = await tx.transactionsTracker.findUnique({
                        where: {
                            checkoutRequestId: contData.checkout_request_id,
                        },
                        select: {
                            metadata: true,
                            transactionId: true,
                        },
                    });

                    if (!userInfo) {
                        throw new Error(
                            `Transaction tracker not found for checkout request ${contData.checkout_request_id}`,
                        );
                    }

                    const metadata = userInfo.metadata as any;

                    if (!metadata?.userId || !metadata?.companyId) {
                        throw new Error(
                            `Missing userId or companyId in transaction metadata`,
                        );
                    }

                    const createdContribution =
                        await this.contributionRepo.createContribution(
                            {
                                userId: metadata.userId,
                                companyId: metadata.companyId,
                                transactionRef: contData.mpesa_receipt_number,
                                amount: Number(contData.amount),
                            },
                            tx,
                        );
                    
                    this.logger.log(`Created contribution with ID: ${createdContribution.id} for user: ${metadata.userId} in company: ${metadata.companyId}`);

                    if (!createdContribution) {
                        throw new Error('Failed to create contribution');
                    }

                    const approved =await this.contributionRepo.approveContribution(
                            createdContribution.id,
                            {
                                processedBy: 'automated_processing',
                                adminNotes: 'approved',
                                approvalStatus: 'APPROVED',
                            },
                            tx,
                        );

                    if (!(approved as any)) {
                        throw new Error(`Failed to approve contribution:${approved}`);
                    }

                    await tx.transactionsTracker.update({
                        where: {
                            transactionId: userInfo.transactionId,
                        },
                        data: {
                            status: 'COMPLETED',
                        },
                    });

                    return approved;
                },
                {
                    timeout: 30000, // 30 seconds
                },
            );

            // Publish only after transaction commits successfully
            await this.publisher.publish(
                channelName,
                JSON.stringify({
                    type: 'payment_success',
                    success: contData.result_desc,
                }),
            );

            return result;
        } catch (error: any) {
            this.logger.error(
                `Failed to process job ${job.id}: ${error.message}`,
                error.stack,
            );

            await this.prisma.transactionsTracker.updateMany({
                where: {
                    checkoutRequestId: contData.checkout_request_id,
                },
                data: {
                    status: 'FAILED',
                },
            });

            await this.publisher.publish(
                channelName,
                JSON.stringify({
                    type: 'payment_failed',
                    error: error.message,
                }),
            );

            throw error; // BullMQ marks the job as failed and can retry if configured
        }
    }

}