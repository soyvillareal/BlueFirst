import { Body, Controller, HttpStatus, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { AnonymousLoginAuthDto, LoginAuthDto, LoginAuthResponseDto } from './dto/login-auth.dto';
import { AuthGuard } from './auth.guard';
import { AnonymousAuthDto } from './dto/session-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      $ref: getSchemaPath(RegisterAuthDto),
    },
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'USERNAME_OR_EMAIL_ALREADY_EXISTS' })
  @ApiOperation({ summary: 'Register a user' })
  @UseGuards(AuthGuard)
  @Post('register')
  @UseInterceptors(FileInterceptor('file'))
  register(@Body() registerAuthDto: RegisterAuthDto, @UploadedFile() file: Express.Multer.File) {
    return this.authService.register(registerAuthDto, file);
  }

  @ApiBearerAuth()
  @ApiExtraModels(LoginAuthResponseDto)
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      $ref: getSchemaPath(LoginAuthResponseDto),
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'USER_NOT_FOUND' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'INVALID_CREDENTIALS' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'SESSION_NOT_CREATED' })
  @ApiOperation({ summary: 'Log in to the platform' })
  @UseGuards(AuthGuard)
  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto): Promise<LoginAuthResponseDto> {
    return this.authService.login(loginAuthDto);
  }

  @ApiExtraModels(AnonymousAuthDto)
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      $ref: getSchemaPath(AnonymousAuthDto),
    },
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'SESSION_NOT_CREATED' })
  @Post('anonymous-login')
  anonymousLogin(@Body() anonymousLoginAuthDto: AnonymousLoginAuthDto): Promise<AnonymousAuthDto> {
    return this.authService.anonymousLogin(anonymousLoginAuthDto);
  }
}
