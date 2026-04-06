import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Request,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { AiService } from './ai.service';
import { ProcessTextRequestDto } from './dto/process-text-request.dto';
import { ProcessTextResponseDto } from './dto/process-text-response.dto';
import { ConfirmAiResultRequestDto } from './dto/confirm-ai-result-request.dto';
import { ConfirmAiResultResponseDto } from './dto/confirm-ai-result-response.dto';
import { TranscribeVoiceResponseDto } from './dto/transcribe-voice-response.dto';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Keep AI acknowledgements readable by preserving the specific validation message.
  private getExceptionMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpException)) {
      return fallbackMessage;
    }

    const response = error.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object') {
      const message = (response as { message?: string | string[] }).message;

      if (Array.isArray(message)) {
        return message.join(' ');
      }

      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    return error.message || fallbackMessage;
  }

  @Post('process-text')
  async processText(
    @Request() req: any,
    @Body() processTextRequestDto: ProcessTextRequestDto,
  ): Promise<ApiResponse<ProcessTextResponseDto>> {
    try {
      const result = await this.aiService.processText(
        req.user.userId,
        processTextRequestDto,
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Text processed successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        const errorMessage = this.getExceptionMessage(
          error,
          'Unable to process this instruction.',
        );

        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: errorMessage,
          error: errorMessage,
        };
      }

      if (error instanceof InternalServerErrorException) {
        const errorMessage = this.getExceptionMessage(
          error,
          'Something went wrong while processing your request. Please try again.',
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: errorMessage,
            error: errorMessage,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong while processing your request. Please try again.';

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: errorMessage,
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('process-voice')
  @UseInterceptors(FileInterceptor('file'))
  async processVoice(
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ApiResponse<ProcessTextResponseDto>> {
    try {
      const result = await this.aiService.processVoice(req.user.userId, file);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Voice processed successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        const errorMessage = this.getExceptionMessage(
          error,
          'Unable to process this voice instruction.',
        );

        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: errorMessage,
          error: errorMessage,
        };
      }

      if (error instanceof InternalServerErrorException) {
        const errorMessage = this.getExceptionMessage(
          error,
          'Something went wrong while processing your voice request. Please try again.',
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: errorMessage,
            error: errorMessage,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong while processing your voice request. Please try again.';

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: errorMessage,
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('transcribe-voice')
  @UseInterceptors(FileInterceptor('file'))
  async transcribeVoice(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ApiResponse<TranscribeVoiceResponseDto>> {
    try {
      const result = await this.aiService.transcribeVoice(file);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Voice transcribed successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        const errorMessage = this.getExceptionMessage(
          error,
          'Unable to transcribe this voice instruction.',
        );

        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: errorMessage,
          error: errorMessage,
        };
      }

      if (error instanceof InternalServerErrorException) {
        const errorMessage = this.getExceptionMessage(
          error,
          'Something went wrong while transcribing your voice request. Please try again.',
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: errorMessage,
            error: errorMessage,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong while transcribing your voice request. Please try again.';

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: errorMessage,
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('confirm')
  async confirmResult(
    @Request() req: any,
    @Body() confirmAiResultRequestDto: ConfirmAiResultRequestDto,
  ): Promise<ApiResponse<ConfirmAiResultResponseDto | null>> {
    try {
      const result = await this.aiService.confirmResult(
        req.user.userId,
        confirmAiResultRequestDto,
      );

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'AI result confirmed successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        const errorMessage = this.getExceptionMessage(
          error,
          'Unable to confirm this Smart Text Add result.',
        );

        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: errorMessage,
          error: errorMessage,
          data: null,
        };
      }

      const errorMessage =
        error instanceof HttpException
          ? this.getExceptionMessage(
              error,
              'Unable to confirm this Smart Text Add result.',
            )
          : error instanceof Error
            ? error.message
            : 'Unable to confirm this Smart Text Add result.';

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: errorMessage,
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
