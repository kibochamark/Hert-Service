import { Injectable, Logger } from "@nestjs/common";
import { AccountType, AuditAction } from "generated/prisma/enums";
import { CompanyData, UserData } from "src/common/types/company.types";
import { PrismaService } from "src/prisma/prisma.service";


@Injectable()
export class CompanyRepository {
    private logger = new Logger(CompanyRepository.name);
    constructor(private readonly prisma: PrismaService) {

    }

    async createCompany(companyData:CompanyData) { 
        try{
            this.logger.log(`Creating company with name: ${companyData.name} `);

            const [company] = await this.prisma.$transaction(async (tx) =>{
                const company = await tx.company.create({
                    data: {
                        name: companyData.name,
                        description: companyData.description,
                    },
                })

                // add audit log
                await tx.auditLog.create({
                    data: {
                        action: AuditAction.CREATE as AuditAction,
                        entityName: 'Company',
                        entityId: company.id,
                        newValue: JSON.stringify(company),
                        companyId: company.id
                    },
                });

                // 2. Initialize System Accounts
                const systemAccounts = [
                    { name: 'Main Cash Wallet', type: 'ASSET' as AccountType, companyId: company.id },
                    { name: 'Investment Returns', type: 'REVENUE' as AccountType, companyId: company.id },
                    { name: 'Operating Expenses', type: 'EXPENSE' as AccountType, companyId: company.id },
                ];

                await tx.memberAccount.createMany({ data: systemAccounts });

                // add audit log
                await tx.auditLog.create({
                    data: {
                        action: AuditAction.CREATE as AuditAction,
                        entityName: 'MemberAccount',
                        entityId: '',
                        newValue: JSON.stringify({}),
                        companyId: company.id
                    },
                });

                return [company];
                
            });

            this.logger.log(`Company created successfully with ID: ${company.id}`);
            return company;

        }catch(error){
            this.logger.error(`Error creating company: ${error.message}`);
            throw error;
        }

    }

    async getCompanyById(companyId: string) {
        try{
            this.logger.log(`Fetching company with ID: ${companyId}`);
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
            });

            if(!company){
                this.logger.warn(`Company not found with ID: ${companyId}`);
                return null;
            }

            this.logger.log(`Company fetched successfully with ID: ${companyId}`);
            return company;

        }catch(error){
            this.logger.error(`Error fetching company: ${error.message}`);
            throw error;
        }
    }


    async getCompanyProfile(companyId:string){

        try {
            this.logger.log(`Fetching company profile for company ID: ${companyId}`);

            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                select:{
                    name: true,
                    description: true,
                    id: true,
                }
            });

            const summary = await this.prisma.user.aggregate({
                where: { id: companyId },
                _count: {
                    id: true,
                },  
            })

            this.logger.log(`Company profile fetched successfully for company ID: ${companyId}`);

            return {
                ...company,
                totalUsers: summary._count.id,
            }
        
            
        } catch (error) {
            this.logger.error(`Error fetching company profile: ${error.message}`);
            throw error;
        }

    }

    async updateCompany(companyId: string, companyData: Partial<CompanyData>) {
        try{
            this.logger.log(`Updating company with ID: ${companyId}`);

            const updatedCompany = await this.prisma.company.update({
                where: { id: companyId },
                data: {
                    name: companyData.name,
                    description: companyData.description,
                },
            });

            // add audit log
            await this.prisma.auditLog.create({
                data: {
                    action: AuditAction.UPDATE as AuditAction,
                    entityName: 'Company',
                    entityId: companyId,
                    newValue: JSON.stringify(updatedCompany),
                    companyId: companyId
                },
            });

            this.logger.log(`Company updated successfully with ID: ${companyId}`);
            return updatedCompany;

        }catch(error){
            this.logger.error(`Error updating company: ${error.message}`);
            throw error;
        }
    }

    async deleteCompany(companyId: string) {
        try{
            this.logger.log(`Deleting company with ID: ${companyId}`);

            const deletedCompany = await this.prisma.company.delete({
                where: { id: companyId },
            });

            // add audit log
            await this.prisma.auditLog.create({
                data: {
                    action: AuditAction.DELETE as AuditAction,
                    entityName: 'Company',
                    entityId: companyId,
                    newValue: JSON.stringify(deletedCompany),
                    companyId: companyId
                },
            });

            this.logger.log(`Company deleted successfully with ID: ${companyId}`);
            return deletedCompany;

        }catch(error){
            this.logger.error(`Error deleting company: ${error.message}`);
            throw error;
        }
    }
}

