import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import AWS from 'aws-sdk';
import { BucketName } from 'aws-sdk/clients/elastictranscoder';

import { IFindUserByEmailOrUsername, IS3UpdateOptions, IUserResponse } from 'src/users/users.interface';
import { UsersEntity } from 'src/auth/entities/users.entity';
import env from 'src/common/env';
import { DEFAULT_AVATAR } from 'src/common/constants';

import { UpdateUserDto } from './dto/update-user.dto';
import { PageOptionsDto } from './dto/page-options.dto';
import { PageMetaDto } from './dto/page-meta.dto';
import { PageDto } from './dto/page.dto';
import { UserPaginationDto } from './dto/user-pagination.dto';

@Injectable()
export class UsersService {
  private s3: AWS.S3;

  constructor(@InjectRepository(UsersEntity) private usersService: Repository<UsersEntity>) {
    this.s3 = new AWS.S3({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    });
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<UserPaginationDto>> {
    const queryBuilder = this.usersService.createQueryBuilder('user');

    queryBuilder
      .orderBy('user.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.avatar',
        'user.username',
        'user.email',
        'user.birthdate',
        'user.gender',
        'user.updatedAt',
        'user.createdAt',
      ]);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: string) {
    const userFound = await this.findUserById(id, [
      'id',
      'firstName',
      'lastName',
      'avatar',
      'username',
      'email',
      'birthdate',
      'gender',
      'updatedAt',
      'createdAt',
    ]);

    if (!userFound) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return userFound;
  }

  async update(id: string, updateUserDto: UpdateUserDto, file?: Express.Multer.File): Promise<IUserResponse | HttpException> {
    const { firstName, lastName, username, email, password, birthdate, gender } = updateUserDto;
    const userFound = await this.findUserById(id, ['avatar', 'username', 'email']);

    if (userFound.username !== username) {
      const usernameExists = await this.usersService.count({
        where: { username },
      });

      if (usernameExists) {
        throw new HttpException('USERNAME_ALREADY_EXISTS', HttpStatus.CONFLICT);
      }
    }

    if (userFound.email !== email) {
      const emailExists = await this.usersService.count({
        where: { email },
      });

      if (emailExists) {
        throw new HttpException('EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
      }
    }

    if (!userFound) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    let avatar = DEFAULT_AVATAR;

    if (file) {
      const avatarUploaded = await this.S3Update(env.AWS_S3_BUCKET_UPLOADS, {
        newFilename: `${username}-${new Date().getTime()}.${file.mimetype.split('/')[1]}`,
        oldFilename: userFound.avatar,
        buffer: file.buffer,
        mime: file.mimetype,
      });
      if (avatarUploaded) {
        avatar = avatarUploaded;
      }
    }

    const data = {
      id,
      firstName,
      lastName,
      username,
      avatar,
      email,
      password,
      birthdate,
      gender,
    };

    console.log(data);

    const userSaved = await this.usersService.save(data);

    delete userSaved.password;

    return userSaved;
  }

  async remove(id: string) {
    const userFound = await this.findUserById(id, ['avatar']);

    if (!userFound) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    await this.S3Delete(env.AWS_S3_BUCKET_UPLOADS, userFound.avatar);

    await this.usersService.delete({ id });
  }

  async findOneByEmailOrUsername({ email, username }: IFindUserByEmailOrUsername): Promise<IUserResponse> {
    return this.usersService.findOne({
      where: [{ email }, { username }],
    });
  }

  findUserById(id: string, options?: FindOneOptions<UsersEntity>['select']): Promise<IUserResponse> {
    return this.usersService.findOne({
      select: options,
      where: { id },
    });
  }

  countUsersById(id: string): Promise<number> {
    return this.usersService.count({
      where: { id },
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
