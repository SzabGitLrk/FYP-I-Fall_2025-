import {
  Controller,
  Get,
  Put,
  Delete,
  Request,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { NotificationService } from './notification.service';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { AuthGuard } from '@nestjs/passport';
import { TranslationService } from '../translation/translation.service';
import { NotificationResponseDto } from './dto/notification-response.dto';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly translationService: TranslationService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Request() req: any,
  ): Promise<ApiResponse<NotificationResponseDto[]>> {
    const lang = req.language;
    const userId = req.user.userId;
    try {
      const notifications = await this.notificationService.findAll(userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.notifications.getAll.success',
          lang,
        ),
        data: instanceToPlain(notifications) as NotificationResponseDto[],
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.notifications.getAll.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/mark-read')
  @UseGuards(AuthGuard('jwt'))
  async markAsRead(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<ApiResponse<void>> {
    const lang = req.language;
    const userId = req.user.userId;
    try {
      await this.notificationService.markAsRead(id, userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.notifications.markRead.success',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.notifications.notFound',
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
            'api.notifications.markRead.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<ApiResponse<void>> {
    const lang = req.language;
    const userId = req.user.userId;
    try {
      await this.notificationService.remove(id, userId);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.notifications.delete.success',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          success: false,
          message: this.translationService.getTranslation(
            'api.notifications.notFound',
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
            'api.notifications.delete.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
