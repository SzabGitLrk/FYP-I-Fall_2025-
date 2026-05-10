import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { TranslationService } from '../translation/translation.service';
import { CustomNotification } from './custom-notification.entity';
import { BaseService } from '../common/base.service';
import { BoxService } from '../box/box.service';
import { Box } from '../box/box.entity';

@Injectable()
export class NotificationService extends BaseService {
  constructor(
    @InjectRepository(CustomNotification)
    private notificationRepository: Repository<CustomNotification>,
    private boxService: BoxService,
    private translationService: TranslationService,
  ) {
    super();
  }

  async findAll(userId: string): Promise<CustomNotification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(
        this.translationService.getTranslation(
          'api.notifications.notFoundById',
          this.getLang(),
          {
            id: notificationId.toString(),
          },
        ),
      );
    }

    notification.isRead = true;
    await this.notificationRepository.save(notification);
  }

  async create(
    title: string,
    message: string,
    box: Box,
  ): Promise<CustomNotification> {
    const notification = new CustomNotification();
    notification.title = title;
    notification.message = message;
    notification.userId = box.storage.user.id;
    notification.avatar = box.image;
    notification.boxId = box.id;

    return this.notificationRepository.save(notification);
  }

  async remove(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(
        this.translationService.getTranslation(
          'api.notifications.notFoundById',
          this.getLang(),
          {
            id: notificationId,
          },
        ),
      );
    }

    await this.notificationRepository.delete(notificationId);
  }

  @Cron('0 0 * * 1') // Runs every Monday at 00:00 (Midnight)
  async sendWeeklyReminders(): Promise<void> {
    const outdatedBoxes = await this.boxService.findOutdatedBoxes();

    for (const box of outdatedBoxes) {
      if (box.storage && box.storage.user) {
        const title = `The box '${box.name}' in storage '${box.storage.name}'`;
        const message = 'Inactive for over a week';
        await this.create(title, message, box);
      }
    }
  }
}
