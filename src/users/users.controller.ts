import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthGuard } from 'src/auth/auth.guard';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PageOptionsDto } from './dto/page-options.dto';
import { PageDto } from './dto/page.dto';
import { UserPaginationDto } from './dto/user-pagination.dto';
import { ApiPaginatedResponse } from './users.decorator';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('get-all')
  @HttpCode(HttpStatus.OK)
  @ApiPaginatedResponse(UserPaginationDto)
  @ApiOperation({ summary: 'Get all users' })
  findAll(
    // @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    // @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<UserPaginationDto>> {
    return this.usersService.findAll(pageOptionsDto);
  }

  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      $ref: getSchemaPath(UserPaginationDto),
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'USER_NOT_FOUND' })
  @ApiOperation({ summary: 'Get user by id' })
  @Get('get-account/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      $ref: getSchemaPath(UpdateUserDto),
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'USER_NOT_FOUND' })
  @ApiOperation({ summary: 'Update user by id' })
  @Patch('update-account/:id')
  @UseInterceptors(FileInterceptor('file'))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.update(id, updateUserDto, file);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'USER_NOT_FOUND' })
  @ApiOperation({ summary: 'Delete user by id' })
  @Delete('delete-account/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
