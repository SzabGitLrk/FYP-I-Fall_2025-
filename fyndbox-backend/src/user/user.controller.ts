import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Request,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { AuthGuard } from '@nestjs/passport';
import { TranslationService } from '../translation/translation.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly translationService: TranslationService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Request() req: any): Promise<ApiResponse<UserResponseDto[]>> {
    const lang = req.language;
    try {
      const users = await this.userService.findAll();
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.users.getAll.success',
          lang,
        ),
        data: instanceToPlain(users) as UserResponseDto[],
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.users.getAll.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Request() req: any): Promise<ApiResponse<UserResponseDto>> {
    const lang = req.language;
    try {
      const userId = req.user.userId;
      const user = await this.userService.findOne(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.users.me.success',
          lang,
        ),
        data: instanceToPlain(user) as UserResponseDto,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.users.me.notFound',
            lang,
          ),
          error: error.message,
        };
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.users.me.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: any,
  ): Promise<ApiResponse<UserResponseDto>> {
    const lang = req.language;
    try {
      const newUser = await this.userService.create(createUserDto);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: this.translationService.getTranslation(
          'api.users.create.success',
          lang,
        ),
        data: instanceToPlain(newUser) as UserResponseDto,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.users.create.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('deactivate')
  @UseGuards(AuthGuard('jwt'))
  async deactivateUser(@Request() req: any): Promise<ApiResponse<void>> {
    const lang = req.language;
    try {
      const userId = req.user.userId;
      await this.userService.deactivateUser(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.users.deactivate.success',
          lang,
          {
            id: userId.toString(),
          },
        ),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.users.me.notFound',
            lang,
          ),
          error: error.message,
        };
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.users.deactivate.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put()
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Request() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const lang = req.language;
    try {
      const userId = req.user.userId;
      const updatedUser = await this.userService.update(userId, updateUserDto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.users.update.success',
          lang,
        ),
        data: instanceToPlain(updatedUser) as UserResponseDto,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.users.me.notFound',
            lang,
          ),
          error: error.message,
        };
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.users.update.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Request() req: any): Promise<ApiResponse<void>> {
    const lang = req.language;
    try {
      const userId = req.user.userId;
      await this.userService.remove(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.users.delete.success',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.users.me.notFound',
            lang,
          ),
          error: error.message,
        };
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.users.delete.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
