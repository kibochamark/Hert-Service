import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountType } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';


interface LedgerTransactionDto {
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description: string;
    userId: string;
    companyId: string;
    referenceId?: string;
    metadata?: any;
}

@Injectable()
export class LedgerService {
    constructor(private prisma: PrismaService) { }

    async executeTransfer(dto: LedgerTransactionDto) {
        return await this.prisma.$transaction(async (tx) => {
            // 0. Fetch account types to determine mathematical direction
            const [debitAcc, creditAcc] = await Promise.all([
                tx.memberAccount.findUnique({ where: { id: dto.debitAccountId } }),
                tx.memberAccount.findUnique({ where: { id: dto.creditAccountId } }),
            ]);

            if (!debitAcc || !creditAcc) {
                throw new BadRequestException('One or both accounts not found');
            }

            /**
             * 1. Update Debit Account
             * DEBITS increase: Assets, Expenses
             * DEBITS decrease: Equity, Revenue, Liabilities
             */
            const debitIncreasingTypes = [
                AccountType.ASSET,
                AccountType.EXPENSE,
                AccountType.INVESTMENT,
            ] as const;

            const isDebitIncreasing = debitIncreasingTypes.includes(
                debitAcc.type as (typeof debitIncreasingTypes)[number]
            );

            const updatedDebitAccount = await tx.memberAccount.update({
                where: { id: dto.debitAccountId },
                data: {
                    balance: isDebitIncreasing
                        ? { increment: dto.amount }
                        : { decrement: dto.amount }
                },
            });

            /**
             * 2. Update Credit Account
             * CREDITS increase: Equity, Revenue, Liabilities
             * CREDITS decrease: Assets, Expenses
             */
            const creditIncreasingTypes = [AccountType.MEMBER_EQUITY, AccountType.REVENUE] as const
            const isCreditIncreasing = creditIncreasingTypes    .includes(creditAcc.type as (typeof creditIncreasingTypes)[number]);

            const updatedCreditAccount = await tx.memberAccount.update({
                where: { id: dto.creditAccountId },
                data: {
                    balance: isCreditIncreasing
                        ? { increment: dto.amount }
                        : { decrement: dto.amount }
                },
            });

            // 3. Create the Permanent Ledger Entry
            const entry = await tx.ledgerEntry.create({
                data: {
                    amount: dto.amount,
                    description: dto.description,
                    debitAccountId: dto.debitAccountId,
                    creditAccountId: dto.creditAccountId,
                    referenceId: dto.referenceId,
                    metadata: dto.metadata,
                },
            });

            // 4. Create Audit Log
            await tx.auditLog.create({
                data: {
                    action: 'CREATE',
                    entityName: 'LedgerEntry',
                    entityId: entry.id,
                    userId: dto.userId,
                    companyId: dto.companyId,
                    description: `Transaction: ${dto.description}. Moved ${dto.amount} from ${creditAcc.name} to ${debitAcc.name}`,
                    oldValue: { debitPrev: debitAcc.balance, creditPrev: creditAcc.balance },
                    newValue: { debitNew: updatedDebitAccount.balance, creditNew: updatedCreditAccount.balance },
                },
            });

            return entry;
        });
    }
}