import { Request } from 'express';
import { Role } from 'generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        companyId: string;
        role: Role;
        // Add other properties of the user object if they are consistently available
      };
    }
  }
}
