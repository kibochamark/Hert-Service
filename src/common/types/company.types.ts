export interface CompanyData {
  id?: string;
  name: string;
  description: string;
}

export interface UserData {
  id?: string;
  name: string;
  email: string;
  password: string;
  companyId: string;
}