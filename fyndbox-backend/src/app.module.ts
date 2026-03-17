import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TranslationModule } from './translation/translation.module';
import { StorageModule } from './storage/storage.module';
import { BoxModule } from './box/box.module';
import { ItemModule } from './item/item.module';
import { ImageModule } from './image/image.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './notification/notification.module';
import { TextProcessingModule } from './ai/modules/text-processing.module';
import { join } from 'path';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      // Ensure backend/.env is loaded even when the app is started from the monorepo root.
      envFilePath: [join(__dirname, '..', '.env')],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        if (isProduction && configService.get<string>('DATABASE_URL')) {
          // Production configuration with DATABASE_URL (Heroku)
          return {
            type: 'postgres',
            url: configService.get<string>('DATABASE_URL'),
            autoLoadEntities: true,
            synchronize: true, // Disable synchronize in production for safety
            ssl: {
              rejectUnauthorized: false, // Ensure SSL is used
            },
          };
        }

        // Development environment
        const dbName = configService.get<string>('DB_NAME');
        const dbHost = configService.get<string>('DB_HOST');
        const dbPort = configService.get<number>('DB_PORT');
        const dbUser = configService.get<string>('DB_USERNAME');
        const dbPassword = configService.get<string>('DB_PASSWORD');

        // Create a temporary DataSource to connect to the default 'postgres' database
        const tempDataSource = new DataSource({
          type: 'postgres',
          host: dbHost,
          port: dbPort,
          username: dbUser,
          password: dbPassword,
          database: 'postgres', // Default database for managing new databases
        });

        await tempDataSource.initialize();

        // Check if the target database exists
        const result = await tempDataSource.query(
          `SELECT 1 FROM pg_database WHERE datname = $1`,
          [dbName],
        );

        if (result.length === 0) {
          // Database does not exist, create it
          await tempDataSource.query(`CREATE DATABASE "${dbName}"`);
          console.log(`Database ${dbName} created successfully.`);
        }

        // Close the temporary connection
        await tempDataSource.destroy();

        // Return development configuration
        return {
          type: 'postgres',
          host: dbHost,
          port: dbPort,
          username: dbUser,
          password: dbPassword,
          database: dbName,
          autoLoadEntities: true,
          synchronize: true, // Enable synchronize in development
        };
      },
    }),
    UserModule,
    AuthModule,
    TranslationModule,
    StorageModule,
    BoxModule,
    ItemModule,
    ImageModule,
    NotificationModule,
    // AI text-processing endpoints.
    TextProcessingModule,
  ],
})
export class AppModule {}
