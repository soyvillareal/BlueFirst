import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@vendia/serverless-express';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import env from './common/env';
import { setupSwagger } from './common/setup-swagger';

const RUN_IN_LOCAL = env.NODE_ENV === 'local' && !env.IS_OFFLINE;

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  // enable validation globally
  // this is from NestJS docs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  setupSwagger(app);

  if (RUN_IN_LOCAL) {
    app.enableCors();
    await app.listen(3000);
  } else {
    app.enableCors({
      origin: env.ORIGIN,
      methods: 'GET,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
    });
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    return serverlessExpress({ app: expressApp });
  }
};
if (RUN_IN_LOCAL) bootstrap();
