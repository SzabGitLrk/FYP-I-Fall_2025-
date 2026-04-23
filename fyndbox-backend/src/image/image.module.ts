import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { ConfigModule } from '@nestjs/config';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [ConfigModule, TranslationModule],
  controllers: [ImageController],
  providers: [ImageService],
})
export class ImageModule {}
