import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

import { UsersService } from 'src/users/users.service';
import env from 'src/common/env';
import { DEFAULT_AVATAR } from 'src/common/constants';
import { AwsService } from 'src/aws/aws.service';

import { RegisterAuthDto } from './dto/register-auth.dto';
import { UsersEntity } from './entities/users.entity';
import { SessionsEntity } from './entities/sessions.entity';
import { AnonymousLoginAuthDto, LoginAuthDto, LoginAuthResponseDto } from './dto/login-auth.dto';
import { AnonymousAuthDto, ESessionAuthType } from './dto/session-auth.dto';
import { HOURS_OFFSET, SESSION_DURATION_IN_HOURS_ANONYMOUS, SESSION_DURATION_IN_HOURS_AUTH } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersEntity) private authService: Repository<UsersEntity>,
    @InjectRepository(SessionsEntity) private sessionsService: Repository<SessionsEntity>,
    private readonly usersService: UsersService,
    private jwtAuthService: JwtService,
    private readonly awsService: AwsService,
  ) {}

  async register(registerAuthDto: RegisterAuthDto, file?: Express.Multer.File) {
    const { email, username, password, firstName, lastName, birthdate, gender } = registerAuthDto;

    console.log('-----------------------------');
    console.log(file);
    console.log(registerAuthDto);
    console.log('-----------------------------');

    const userFound = await this.usersService.findOneByEmailOrUsername({
      email,
      username,
    });

    if (userFound) {
      throw new HttpException('USERNAME_OR_EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
    }

    let avatar = DEFAULT_AVATAR;

    if (file) {
      const avatarUploaded = await this.awsService.S3Upload(
        file.buffer,
        env.CLOUD_S3_BUCKET_UPLOADS,
        `${username}-${new Date().getTime()}.${file.mimetype.split('/')[1]}`,
        file.mimetype,
      );
      if (avatarUploaded) {
        avatar = avatarUploaded.Key.split('/')[1];
      }
    }

    const userCreated = this.authService.create({ email, username, password, firstName, lastName, avatar, birthdate, gender });

    const userSaved = await this.authService.save(userCreated);

    delete userSaved.password;

    return userSaved;
  }

  async login(loginAuthDto: LoginAuthDto): Promise<LoginAuthResponseDto> {
    const { loginId, password } = loginAuthDto;

    const userFound = await this.authService.findOne({
      select: [
        'id',
        'firstName',
        'lastName',
        'avatar',
        'username',
        'email',
        'password',
        'birthdate',
        'gender',
        'updatedAt',
        'createdAt',
      ],
      where: [{ email: loginId }, { username: loginId }],
    });

    if (!userFound) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const comparePassword = await bcrypt.compare(password, userFound.password);

    if (!comparePassword) {
      throw new HttpException('INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
    }

    // Dont send password in response or token
    delete userFound.password;

    const DURATION = HOURS_OFFSET * SESSION_DURATION_IN_HOURS_AUTH;

    const session_id = uuidv4();

    const expiredAt = new Date(new Date().getTime() + DURATION);

    const result = {
      id: session_id,
      type: ESessionAuthType.AUTH,
      user: {
        id: userFound.id,
        firstName: userFound.firstName,
        lastName: userFound.lastName,
        username: userFound.username,
        avatar: userFound.avatar,
        email: userFound.email,
        birthdate: userFound.birthdate,
        gender: userFound.gender,
        updatedAt: userFound.updatedAt,
        createdAt: userFound.createdAt,
      },
      expiredAt: expiredAt,
    };

    const token = this.jwtAuthService.sign(result, {
      expiresIn: DURATION,
    });

    const sessionCreated = this.session({
      id: session_id,
      userId: userFound.id,
      type: ESessionAuthType.AUTH,
      jwt: token,
      expiredAt: expiredAt,
    });

    if (!sessionCreated) {
      throw new HttpException('SESSION_NOT_CREATED', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      ...result,
      jwt: token,
    };
  }

  async anonymousLogin(anonymousAuthDto: AnonymousLoginAuthDto): Promise<AnonymousAuthDto> {
    const { seed } = anonymousAuthDto;

    const DURATION = HOURS_OFFSET * SESSION_DURATION_IN_HOURS_ANONYMOUS;

    const expiredAt = new Date(new Date().getTime() + DURATION);

    const session_id = uuidv4();

    const result = {
      id: session_id,
      user_id: null,
      type: ESessionAuthType.ANONYMOUS,
      expiredAt: expiredAt,
    };

    const token = this.jwtAuthService.sign(
      {
        ...result,
        seed,
      },
      {
        expiresIn: DURATION,
      },
    );

    const data = {
      id: session_id,
      userId: null,
      type: ESessionAuthType.ANONYMOUS,
      jwt: token,
      expiredAt: expiredAt,
    };

    const sessionCreated = this.session(data);

    if (!sessionCreated) {
      throw new HttpException('SESSION_NOT_CREATED', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  async session(anonymousAuthDto: AnonymousAuthDto): Promise<SessionsEntity> {
    const sessionCreated = this.sessionsService.create(anonymousAuthDto);

    return this.sessionsService.save(sessionCreated);
  }
}
