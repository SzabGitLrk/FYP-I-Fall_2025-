import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { AiService } from './ai.service';
import { ConfirmAiResultDto } from './dto/confirm-ai-result.dto';
import { ProcessTextDto, ProcessTextResponseDto } from './dto/process-text.dto';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Post('process-text')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'))
    processText(
        @Request() req: any,
        @Body() processTextDto: ProcessTextDto,
    ): Promise<ApiResponse<ProcessTextResponseDto>> {
        return this.aiService.processText(req.user?.userId, processTextDto);
    }

    @Post('confirm')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'))
    confirmResult(
        @Request() req: any,
        @Body() confirmDto: ConfirmAiResultDto,
    ): Promise<ApiResponse<any>> {
        return this.aiService.confirmResult(req.user?.userId, confirmDto);
    }
}
