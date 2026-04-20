import { Injectable, Logger } from "@nestjs/common";
import { role } from "better-auth/plugins";
import { AccountType } from "generated/prisma/browser";
import { UserData } from "src/common/types/company.types";
import { PrismaService } from "src/prisma/prisma.service";



@Injectable()
export class UsersRepository {
    private readonly logger = new Logger(UsersRepository.name);

    constructor(private readonly prisma: PrismaService) {}


    async createUser(userData: UserData) {
        try {
            const user = await this.prisma.$transaction(async (tx) => { 
                const user = await tx.user.create({
                    data: {
                        name: userData.name,
                        email: userData.email,
                        // password: userData.password,
                        companyId: userData.companyId,
                        role:  "MEMBER",
                    }
                });


                console.log(`Creating user with email: ${userData.email} in company: ${userData.companyId}`);
  

                // ADD AUDIT LOG
                await tx.auditLog.create({
                    data: {
                        action: 'CREATE',
                        entityName: 'User',
                        entityId: user.id,
                        newValue: JSON.stringify(user),
                        companyId: userData.companyId
                    }
                });

                this.logger.log(`Created user with email: ${userData.email} in company: ${userData.companyId}`);

                return user;
            })
            

            this.logger.log(`Created user with email: ${userData.email} in company: ${userData.companyId}`);
            return user;
            
        } catch (error) {
            this.logger.error(`Error creating user with email: ${userData.email} in company: ${userData.companyId}`, error);
            throw error;
            
        }
        
    }


    async getUserByEmail(email: string) {
        try {
            this.logger.log(`Fetching user with email: ${email}`);
            const user = await this.prisma.user.findUnique({ where: { email } });
            if (!user) {
                this.logger.warn(`User with email: ${email} not found`);
            }
            return user;        
            
        } catch (error) {
            this.logger.error(`Error fetching user with email: ${email}`, error);
            throw error;
        }
        return this.prisma.user.findUnique({ where: { email } });
    }

    async getUserById(userId: string) {
        try {
            this.logger.log(`Fetching user with ID: ${userId}`);
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                this.logger.warn(`User with ID: ${userId} not found`);
            }
            return user;
        } catch (error) {
            this.logger.error(`Error fetching user with ID: ${userId}`, error);
            throw error;
        }
    }
    

    async updateUser(userId: string, userData: Partial<UserData>) {
        try {
            this.logger.log(`Updating user with ID: ${userId}`);
            const user = await this.prisma.user.update({ where: { id: userId }, data: userData });
            this.logger.log(`Successfully updated user with ID: ${userId}`);
            return user;
        } catch (error) {
            this.logger.error(`Error updating user with ID: ${userId}`, error);
            throw error;
        }
    }

    async deleteUser(userId: string) {
        try {
            this.logger.log(`Deleting user with ID: ${userId}`);
            await this.prisma.user.delete({ where: { id: userId } });
            this.logger.log(`Successfully deleted user with ID: ${userId}`);
        } catch (error) {
            this.logger.error(`Error deleting user with ID: ${userId}`, error);
            throw error;
        }
    }

    async findAllUsers() {
        try {
            this.logger.log('Fetching all users');
            const users = await this.prisma.user.findMany();
            this.logger.log(`Successfully fetched ${users.length} users`);
            return users;
        } catch (error) {
            this.logger.error('Error fetching all users', error);
            throw error;
        }
    }

    async createMemberAccountForUser(userId: string, companyId: string) {
        try {
            this.logger.log(`Creating member account for user ID: ${userId} in company ID: ${companyId}`);
            const memberAccount = await this.prisma.memberAccount.create({
                data: {
                    userId,
                    companyId,
                    name: `Member Account for User ${userId}`,
                    type: AccountType.MEMBER_EQUITY,
                    balance: 0,
                }
            });

            // ADD AUDIT LOG
            await this.prisma.auditLog.create({
                data: {
                    action: 'CREATE',
                    entityName: 'MemberAccount',
                    entityId: memberAccount.id,
                    newValue: JSON.stringify(memberAccount),
                    companyId: companyId
                }
            });

            this.logger.log(`Successfully created member account with ID: ${memberAccount.id} for user ID: ${userId} in company ID: ${companyId}`);
            return memberAccount;
        } catch (error) {
            this.logger.error(`Error creating member account for user ID: ${userId} in company ID: ${companyId}`, error);
            throw error;
        }       

    }


    async findUsersByCompanyId(companyId: string) {
        try {
            this.logger.log(`Finding users for company ID: ${companyId}`);
            const users = await this.prisma.user.findMany({ where: { companyId } });
            this.logger.log(`Found ${users.length} users for company ID: ${companyId}`);
            return users;
        } catch (error) {
            this.logger.error(`Error finding users for company ID: ${companyId}`, error);
            throw error;
        }
    }

    async getMemberAccountByUserId(userId: string) {
        try {
            this.logger.log(`Fetching member account for user ID: ${userId}`);

            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { memberAccount: true },
            });

            if (!user) {
                this.logger.warn(`User with ID: ${userId} not found`);
                return null;
            }

            // Sum all MEMBER_EQUITY balances in the company to compute equity %
            const allMemberAccounts = await this.prisma.memberAccount.findMany({
                where: { companyId: user.companyId, type: AccountType.MEMBER_EQUITY },
                select: { balance: true },
            });

            const companyTotalContributed = allMemberAccounts.reduce(
                (sum, a) => sum + a.balance.toNumber(),
                0,
            );
            const memberBalance = user.memberAccount?.balance.toNumber() ?? 0;
            const equityPercentage =
                companyTotalContributed > 0
                    ? parseFloat(((memberBalance / companyTotalContributed) * 100).toFixed(2))
                    : 0;

            this.logger.log(`Member account fetched for user ID: ${userId}`);
            return {
                userId: user.id,
                equityPercentage,
                totalContributed: memberBalance,
                targetMonthlyContribution: user.targetMonthlyContribution.toNumber(),
                joinedAt: user.createdAt,
                companyId: user.companyId,
            };
        } catch (error) {
            this.logger.error(`Error fetching member account for user ID: ${userId}`, error);
            throw error;
        }
    }

}
