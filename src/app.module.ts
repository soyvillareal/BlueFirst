import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import databaseConfiguration from 'database/database.configuration';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AwsService } from './aws/aws.service';
import { AwsModule } from './aws/aws.module';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfiguration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...configService.get('connection'),
      }),
    }),
    AuthModule,
    UsersModule,
    AwsModule,
  ],
  providers: [
    AwsService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
