import { Module } from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { InvestmentRepository } from './investment.repository';
import { InvestmentController } from './controllers/investment.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvestmentController],
  providers: [InvestmentService, InvestmentRepository],
  exports: [InvestmentService], // Export if other modules might need to inject it
})
export class InvestmentModule {}
