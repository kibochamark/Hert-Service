import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyRepository } from './company.repository';
import { CompanyController } from '../../controllers/company.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompanyController],
  providers: [CompanyService, CompanyRepository],
})
export class CompanyModule {}
