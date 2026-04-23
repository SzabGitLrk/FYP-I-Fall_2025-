import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Request,
  HttpStatus,
  HttpException,
  UseGuards,
  Delete,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ImageService } from './image.service';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { TranslationService } from '../translation/translation.service';

@Controller('images')
@UseGuards(AuthGuard('jwt'))
export class ImageController {
  constructor(
    private readonly imageService: ImageService,
    private readonly translationService: TranslationService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // Use file interceptor for image upload
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<ApiResponse<{ imageUrl: string }>> {
    const lang = req.language;
    try {
      if (!file) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            success: false,
            message: this.translationService.getTranslation(
              'api.images.upload.noFileProvided',
              lang,
            ),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call the image upload service to upload the file to S3
      const imageUrl = await this.imageService.uploadImage(file);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.images.upload.success',
          lang,
        ),
        data: { imageUrl },
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.images.upload.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('delete')
  async deleteImage(
    @Body('key') key: string,
    @Request() req: any,
  ): Promise<ApiResponse<null>> {
    const lang = req.language;
    try {
      if (!key) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            success: false,
            message: this.translationService.getTranslation(
              'api.images.delete.noKeyProvided',
              lang,
            ),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call the image service to delete the file from S3
      await this.imageService.deleteImage(key);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.images.delete.success',
          lang,
        ),
        data: null,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: this.translationService.getTranslation(
            'api.images.delete.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
