import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from 'src/users/users.module';
import env from 'src/common/env';
import { AwsModule } from 'src/aws/aws.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersEntity } from './entities/users.entity';
import { SessionsEntity } from './entities/sessions.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersEntity, SessionsEntity]),
    UsersModule,
    AwsModule,
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET,
      // signOptions: { expiresIn: env.JWT_EXPIRATION_TIME },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
