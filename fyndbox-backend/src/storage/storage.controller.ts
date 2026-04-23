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
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { AuthGuard } from '@nestjs/passport';
import { StorageService } from './storage.service';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';
import { StorageResponseDto } from './dto/storage-response.dto';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { TranslationService } from '../translation/translation.service';

@Controller('storages')
@UseGuards(AuthGuard('jwt'))
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly translationService: TranslationService,
  ) {}

  @Get('search')
  async search(
    @Request() req: any,
    @Query('keyword') keyword: string,
  ): Promise<ApiResponse<StorageResponseDto[]>> {
    const lang = req.language;
    try {
      const storages = await this.storageService.search(
        req.user.userId,
        keyword,
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.storages.search.success',
          lang,
        ),
        data: instanceToPlain(storages) as StorageResponseDto[],
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.storages.search.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(
    @Request() req: any,
  ): Promise<ApiResponse<StorageResponseDto[]>> {
    const lang = req.language;
    try {
      const storages = await this.storageService.findAll(req.user.userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.storages.getAll.success',
          lang,
        ),
        data: instanceToPlain(storages) as StorageResponseDto[],
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.storages.getAll.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ApiResponse<StorageResponseDto>> {
    const lang = req.language;
    try {
      const storage = await this.storageService.findOne(id, req.user.userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.storages.get.success',
          lang,
        ),
        data: instanceToPlain(storage) as StorageResponseDto,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.storages.get.notFound',
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
            'api.storages.get.error',
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
    @Body() createStorageDto: CreateStorageDto,
    @Request() req: any,
  ): Promise<ApiResponse<StorageResponseDto>> {
    const lang = req.language;
    try {
      const newStorage = await this.storageService.create(
        createStorageDto,
        req.user.userId,
      );
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: this.translationService.getTranslation(
          'api.storages.create.success',
          lang,
        ),
        data: instanceToPlain(newStorage) as StorageResponseDto,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.storages.create.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateStorageDto: UpdateStorageDto,
  ): Promise<ApiResponse<StorageResponseDto>> {
    const lang = req.language;
    try {
      const updatedStorage = await this.storageService.update(
        id,
        updateStorageDto,
        req.user.userId,
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.storages.update.success',
          lang,
        ),
        data: instanceToPlain(updatedStorage) as StorageResponseDto,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.storages.get.notFound',
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
            'api.storages.update.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ApiResponse<void>> {
    const lang = req.language;
    try {
      await this.storageService.remove(id, req.user.userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.storages.delete.success',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.storages.get.notFound',
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
            'api.storages.delete.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
