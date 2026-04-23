import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { TranslationService } from '../translation/translation.service';
import { BaseService } from '../common/base.service';
import { BoxService } from '../box/box.service';

@Injectable({ scope: Scope.REQUEST })
export class ItemService extends BaseService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly boxService: BoxService,
    private readonly translationService: TranslationService,
  ) {
    super();
  }

  async findAll(boxId: string): Promise<Item[]> {
    return this.itemRepository.find({
      where: { boxId },
    });
  }

  async findOne(id: string, boxId: string): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { id, boxId },
    });
    if (!item) {
      throw new NotFoundException(
        this.translationService.getTranslation(
          'api.items.notFoundById',
          this.getLang(),
          { id: id.toString() },
        ),
      );
    }
    return item;
  }

  async create(
    createItemDto: CreateItemDto,
    boxId: string,
    storageId: string,
  ): Promise<Item> {
    const box = await this.boxService.findOne(boxId, storageId);
    if (!box) {
      throw new NotFoundException(
        this.translationService.getTranslation(
          'api.boxes.notFoundById',
          this.getLang(),
          { id: boxId.toString() },
        ),
      );
    }

    const item = this.itemRepository.create({
      ...createItemDto,
      box: box,
    });

    return this.itemRepository.save(item);
  }

  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    boxId: string,
  ): Promise<Item> {
    const item = await this.findOne(id, boxId);
    Object.assign(item, updateItemDto);
    return this.itemRepository.save(item);
  }

  async remove(id: string, boxId: string): Promise<void> {
    const item = await this.findOne(id, boxId);
    if (!item) {
      throw new NotFoundException(
        this.translationService.getTranslation(
          'api.items.notFoundById',
          this.getLang(),
          { id: id.toString() },
        ),
      );
    }
    await this.itemRepository.remove(item);
  }
}
