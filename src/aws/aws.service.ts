import { BucketName } from 'aws-sdk/clients/elastictranscoder';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';

import env from 'src/common/env';
import { IS3UpdateOptions } from 'src/users/users.interface';
import { DEFAULT_AVATAR } from 'src/common/constants';

@Injectable()
export class AwsService {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    });
  }

  async S3Upload(buffer: Buffer, bucket: BucketName, name: string, mimetype: string) {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: buffer,
      ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: env.AWS_S3_REGION,
      },
    };

    try {
      return this.s3.upload(params).promise();
    } catch (e) {
      throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async S3Delete(bucket: BucketName, name: string) {
    const params = {
      Bucket: bucket,
      Key: String(name),
    };

    if (name === DEFAULT_AVATAR) return;

    try {
      return this.s3.deleteObject(params).promise();
    } catch (e) {
      throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async S3Update(bucket: BucketName, { newFilename, oldFilename, buffer, mime }: IS3UpdateOptions) {
    const uploadedAvatar = await this.S3Upload(buffer, bucket, newFilename, mime);

    if (!uploadedAvatar) {
      throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    await this.S3Delete(bucket, oldFilename);

    return uploadedAvatar.Key.split('/')[1];
  }
}
