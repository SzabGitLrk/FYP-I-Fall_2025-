import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationModule } from '../translation/translation.module';
import { Item } from './item.entity';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { BoxModule } from '../box/box.module';

@Module({
  imports: [TypeOrmModule.forFeature([Item]), TranslationModule, BoxModule],
  providers: [ItemService],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}
