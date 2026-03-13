import { Module } from '@nestjs/common';
import { TextProcessingService } from './text-processing.service';
import { TextProcessingController } from './text-processing.controller';

/**
 * TextProcessingModule - Module for text processing functionality
 * 
 * Provides natural language processing for user commands:
 * - Parses user input to extract storage, boxes, and items
 * - Classifies user intent (create, add, update, remove)
 * - Normalizes entity names for consistency
 * 
 * Dependencies:
 * - StorageModule: To fetch user's existing storages for context
 * - BoxModule: To fetch user's existing boxes for context
 * - ItemModule: To fetch user's existing items for context
 * 
 * Usage:
 * Import this module in AppModule to enable text processing endpoints
 */
@Module({
    // Register the service - controllers can inject it
    providers: [TextProcessingService],
    // Export service for use in other modules if needed
    exports: [TextProcessingService],
    // Register controller(s) to handle HTTP requests
    controllers: [TextProcessingController],
})
export class TextProcessingModule {}
