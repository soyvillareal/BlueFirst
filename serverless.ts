import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'users-auth',
  frameworkVersion: '3.33.0',
  plugins: ['serverless-offline'],
  useDotenv: true,
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    timeout: 29,
    stage: "${opt:stage, 'dev'}",
    region: 'us-east-1',
    logRetentionInDays: 14,
    versionFunctions: true,
    lambdaHashingVersion: '20201221',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      NODE_ENV: '${sls:stage}',
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      ORIGIN: '${env:ORIGIN}',
      JWT_SECRET: '${env:JWT_SECRET}',
      JWT_EXPIRATION_TIME: '${env:JWT_EXPIRATION_TIME}',
      CLOUD_ACCESS_KEY_ID: '${env:CLOUD_ACCESS_KEY_ID}',
      CLOUD_SECRET_ACCESS_KEY: '${env:CLOUD_SECRET_ACCESS_KEY}',
      CLOUD_S3_BUCKET: '${env:CLOUD_S3_BUCKET}',
      CLOUD_S3_REGION: '${env:CLOUD_S3_REGION}',
      DATABASE_HOST: '${env:DATABASE_HOST}',
      DATABASE_PORT: '${env:DATABASE_PORT}',
      DATABASE_USER: '${env:DATABASE_USER}',
      DATABASE_PASSWORD: '${env:DATABASE_PASSWORD}',
      DATABASE_NAME: '${env:DATABASE_NAME}',
    },
    layers: [{ Ref: 'NodeModulesLambdaLayer' }],
  },
  layers: {
    nodeModules: {
      package: {
        artifact: 'layers/node-modules-layer.zip',
      },
    },
  },
  functions: {
    main: {
      handler: 'dist/src/lambda.handler',
      events: [
        {
          http: {
            method: 'ANY',
            path: '/',
            cors: true,
          },
        },
        {
          http: {
            method: 'ANY',
            path: '/{proxy+}',
            cors: true,
          },
        },
      ],
    },
  },
  package: { individually: true, exclude: ['./**'], include: ['dist/**'] },
  custom: {
    'serverless-offline': {
      httpPort: 3000,
    },
  },
};

module.exports = serverlessConfiguration;
