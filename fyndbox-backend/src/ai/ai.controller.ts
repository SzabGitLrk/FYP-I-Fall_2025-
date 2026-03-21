import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { AiService } from './ai.service';
import { ProcessTextRequestDto } from './dto/process-text-request.dto';
import { ProcessTextResponseDto } from './dto/process-text-response.dto';
import { ConfirmAiResultRequestDto } from './dto/confirm-ai-result-request.dto';
import { ConfirmAiResultResponseDto } from './dto/confirm-ai-result-response.dto';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to process text',
          error: error instanceof Error ? error.message : 'Unknown error',
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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (
        errorMessage === 'No data provided for persistence' ||
        errorMessage === 'Please confirm this change before saving.'
      ) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: errorMessage,
          error: errorMessage,
          data: null,
        };
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to confirm AI result',
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
