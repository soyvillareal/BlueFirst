import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';

import { IFindUserByEmailOrUsername, IUserResponse } from 'src/users/users.interface';
import { UsersEntity } from 'src/auth/entities/users.entity';
import env from 'src/common/env';
import { DEFAULT_AVATAR } from 'src/common/constants';
import { AwsService } from 'src/aws/aws.service';

import { UpdateUserDto } from './dto/update-user.dto';
import { PageOptionsDto } from './dto/page-options.dto';
import { PageMetaDto } from './dto/page-meta.dto';
import { PageDto } from './dto/page.dto';
import { UserPaginationDto } from './dto/user-pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity) private usersService: Repository<UsersEntity>,
    private readonly awsService: AwsService,
  ) {}

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

    if (!userFound) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

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

    let avatar = DEFAULT_AVATAR;

    if (file) {
      const avatarUploaded = await this.awsService.S3Update(env.CLOUD_S3_BUCKET_UPLOADS, {
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

    const toSaveUser = this.usersService.create(data);

    const userSaved = await this.usersService.save(toSaveUser);

    delete userSaved.password;

    return userSaved;
  }

  async remove(id: string) {
    const userFound = await this.findUserById(id, ['avatar']);

    if (!userFound) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    await this.awsService.S3Delete(env.CLOUD_S3_BUCKET_UPLOADS, userFound.avatar);

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
}
