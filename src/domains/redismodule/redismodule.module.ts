import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
    providers:[
        {
            provide: 'REDIS_PUBLISHER',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return new Redis({
                    host: config.get('REDIS_HOST'),
                    port: Number(config.get('REDIS_PORT')),
                    password: config.get('REDIS_PASSWORD'),
                });
            },
        },
    ],
    exports: ['REDIS_PUBLISHER'],
})
export class RedismoduleModule {
    
}
