import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TextProcessingService } from '../service/text-processing/text-processing.service';
import { ConfirmTextProcessingDto, ProcessTextDto, ProcessTextResponseDto } from '../dto/text-processing.dto';
import { ApiResponse } from '@fyndbox/shared/types/api-response';

// Handles text processing endpoints.
@Controller('text-process')
export class TextProcessingController {
    // Inject the text processing service
    constructor(private readonly textProcessingService: TextProcessingService) {}

    // Process user text input (typed response DTO).
    @Post()
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'))
    async processText(
        @Request() req: any,
        @Body() processTextDto: ProcessTextDto,
    ): Promise<ApiResponse<ProcessTextResponseDto>> {
        return this.textProcessingService.processTextRequest(
            req.user?.userId,
            processTextDto,
        );
    }

    // Persist confirmed data.
    @Post('confirm')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'))
    async confirmAndPersist(
        @Request() req: any,
        @Body() confirmDto: ConfirmTextProcessingDto,
    ): Promise<ApiResponse<any>> {
        return this.textProcessingService.confirmAndPersistRequest(
            req.user?.userId,
            confirmDto,
        );
    }
}
