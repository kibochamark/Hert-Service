import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CompanyModule } from './domains/company/company.module';
import { S3Module } from './globalservices/s3/s3.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './domains/users/users.module';
import { ContributionModule } from './domains/contribution/contribution.module';
import { InvestmentModule } from './domains/investment/investment.module';
import { FinancialTransactionsModule } from './domains/financial-transactions/financial-transactions.module';


@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }), PrismaModule, CompanyModule, S3Module, UsersModule, ContributionModule, InvestmentModule, FinancialTransactionsModule],
})
export class AppModule {}
