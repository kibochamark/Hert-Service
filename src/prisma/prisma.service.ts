
import { Global, Injectable, Optional } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import { ConfigService } from '@nestjs/config';
import ws from 'ws';

// Enable WebSocket connections so Neon supports interactive transactions
neonConfig.webSocketConstructor = ws;

@Global()
@Injectable()
export class PrismaService extends PrismaClient {
    constructor(@Optional() config?: ConfigService) {
        const connectionString = config?.get<string>('DATABASE_URL') || process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('DATABASE_URL is required');
        }

        const adapter = new PrismaNeon({ connectionString });

        super({ adapter });
    }
}