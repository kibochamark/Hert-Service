import { Injectable } from '@nestjs/common';
import { CompanyRepository } from './company.repository';
import { CompanyData } from 'src/common/types/company.types';

@Injectable()
export class CompanyService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async createCompany(companyData: CompanyData) {
    return this.companyRepository.createCompany(companyData);
  }

  async getCompanyById(companyId: string) {
    return this.companyRepository.getCompanyById(companyId);
  }

  async getCompanyProfile(companyId: string) {
    return this.companyRepository.getCompanyProfile(companyId);
  }

  async updateCompany(companyId: string, companyData: Partial<CompanyData>) {
    return this.companyRepository.updateCompany(companyId, companyData);
  }

  async deleteCompany(companyId: string) {
    return this.companyRepository.deleteCompany(companyId);
  }
}

