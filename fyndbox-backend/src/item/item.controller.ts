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
  BadRequestException,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { AuthGuard } from '@nestjs/passport';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { TranslationService } from '../translation/translation.service';

@Controller('items')
@UseGuards(AuthGuard('jwt'))
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    private readonly translationService: TranslationService,
  ) {}

  @Get(':boxId')
  async findAll(
    @Param('boxId') boxId: string,
    @Request() req: any,
  ): Promise<ApiResponse<ItemResponseDto[]>> {
    const lang = req.language;
    try {
      const items = await this.itemService.findAll(boxId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.items.getAll.success',
          lang,
        ),
        data: instanceToPlain(items) as ItemResponseDto[],
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.items.getAll.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':boxId/:id')
  async findOne(
    @Param('boxId') boxId: string,
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ApiResponse<ItemResponseDto>> {
    const lang = req.language;
    try {
      const item = await this.itemService.findOne(id, boxId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.items.get.success',
          lang,
        ),
        data: instanceToPlain(item) as ItemResponseDto,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.items.get.notFound',
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
            'api.items.get.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':boxId/:storageId')
  async create(
    @Param('boxId') boxId: string,
    @Param('storageId') storageId: string,
    @Body() createItemDto: CreateItemDto,
    @Request() req: any,
  ): Promise<ApiResponse<ItemResponseDto>> {
    const lang = req.language;
    try {
      const newItem = await this.itemService.create(
        createItemDto,
        boxId,
        storageId,
      );
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: this.translationService.getTranslation(
          'api.items.create.success',
          lang,
        ),
        data: instanceToPlain(newItem) as ItemResponseDto,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.items.create.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':boxId/:id')
  async update(
    @Param('id') id: string,
    @Param('boxId') boxId: string,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req: any,
  ): Promise<ApiResponse<ItemResponseDto>> {
    const lang = req.language;
    try {
      if (!boxId) {
        throw new BadRequestException(
          this.translationService.getTranslation(
            'api.items.boxIDRequired',
            lang,
          ),
        );
      }
      const updatedItem = await this.itemService.update(
        id,
        updateItemDto,
        boxId,
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.items.update.success',
          lang,
        ),
        data: instanceToPlain(updatedItem) as ItemResponseDto,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.items.get.notFound',
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
            'api.items.update.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':boxId/:id')
  async remove(
    @Param('id') id: string,
    @Param('boxId') boxId: string,
    @Request() req: any,
  ): Promise<ApiResponse<void>> {
    const lang = req.language;
    try {
      await this.itemService.remove(id, boxId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.items.delete.success',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.items.get.notFound',
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
            'api.items.delete.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
