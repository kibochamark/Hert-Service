import { Processor, WorkerHost } from "@nestjs/bullmq";
import { ContributionRepository } from "./contribution.repository";
import { Injectable, Logger } from "@nestjs/common";
import { Redis } from 'ioredis';
import { ConfigService } from "@nestjs/config";
import { ContributionJobDto } from "src/common/validators/contribution.validators";
import { Job } from "bullmq";
import { PrismaService } from "src/prisma/prisma.service";


@Processor('process-contribution-job')
@Injectable()
export class ContributionProcessor extends WorkerHost{
    private readonly logger = new Logger(ContributionProcessor.name)
    private readonly publisher: Redis;


    constructor(private contributionRepo:ContributionRepository,
        private configService:ConfigService,
        private prisma:PrismaService
    ){
        super()

        // Setup a publisher client
        this.publisher = new Redis({
            host: this.configService.get("REDIS_HOST"),
            port: Number(this.configService.get("REDIS_PORT")),
            password: this.configService.get("REDIS_PASSWORD"),
        });
    }


    async process(job: Job<ContributionJobDto, any, string>): Promise<any> {
        this.logger.log(`Processing contribution job ${job.id} for ${job.data.checkout_request_id}`);

        const contData = job.data;
        let message_payload= {}

        // Construct the channel name using the checkout request id
        const channelName = `contribution:${job.data.checkout_request_id}`;

        try {
            
            // check job status
            if(contData.status.toLocaleLowerCase() != "completed"){
                this.logger.log("Processing failed transaction")
                // update the transaction in the  tracker table  as failed/cancelled 
                const transaction =  await this.prisma.transactionsTracker.update({
                    where:{
                        checkoutRequestId:contData.checkout_request_id
                    },
                    data:{
                        status:contData.status == "cancelled" ? "CANCELLED" :"FAILED" 
                    }
                })

                message_payload["error"] = contData.result_desc
                message_payload["type"] = "payment_failed"
                await this.publisher.publish(channelName, JSON.stringify(message_payload));
                return transaction
            }


            
            this.logger.log(`Processsing completed transaction`)


            const result= await this.prisma.$transaction(async(tx)=>{
                // fetch user info for this payment
                const userinfo = await tx.transactionsTracker.findUnique({
                    where:{
                        checkoutRequestId: contData.checkout_request_id
                    },
                    select:{
                        metadata:true,
                        transactionId:true
                    }
                })

                if(userinfo.metadata){
                    // create contribution
                    const created_contribution = await this.contributionRepo.createContribution({
                        userId:(userinfo.metadata as any)?.userId as string,
                        companyId: (userinfo.metadata as any)?.companyId as string,
                        transactionRef:contData.mpesa_receipt_number,
                        amount:parseFloat(contData.amount.toLocaleString())
                    })


                    if(created_contribution){
                        // approve contribution
                        const approved= this.contributionRepo.approveContribution(
                            created_contribution.id,
                            {
                                processedBy: "automated_processing",
                                adminNotes:"approved",
                                approvalStatus:"APPROVED"
                            }
                        )

                        if(approved){
                            await tx.transactionsTracker.update({
                                where: {
                                    transactionId: userinfo.transactionId
                                },
                                data: {
                                    status: "COMPLETED"
                                }
                            })

                            message_payload["success"] = contData.result_desc
                            message_payload["type"] = "payment_success"
                            await this.publisher.publish(channelName, JSON.stringify(message_payload));
                            return approved
                        }

                        

                    }
                   


                }
               

                return {
                    success:true,
                    message:"transactipn completed"
                }
            })

            return result

        } catch (error: any) {
            this.logger.error(`Failed to process job ${job.id}: ${error.message}`, error.stack);
            // Publish failure if necessary
            const failChannel = `payment:${job.data.checkout_request_id}`;
            await this.publisher.publish(failChannel, JSON.stringify({
                type: "payment_failed",
                error: error.message
            }));

            this.logger.error(`sending failure message`, error.stack);

            throw error;
        }
    }

}