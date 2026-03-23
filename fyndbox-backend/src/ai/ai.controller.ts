import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Request,
  Post,
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
      if (error instanceof BadRequestException) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Failed to process input',
          error: error.message,
        };
      }

      if (error instanceof InternalServerErrorException) {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to process input',
            error: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to process input',
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
      if (error instanceof BadRequestException) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Failed to confirm AI result',
          error: error.message,
          data: null,
        };
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          success: false,
          message: 'Failed to confirm AI result',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
