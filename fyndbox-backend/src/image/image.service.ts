import { Injectable, Scope } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable({ scope: Scope.REQUEST })
export class ImageService {
  private s3: S3;
  private useLocalStorage: boolean;
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    // Check if AWS credentials are configured
    const awsAccessKey = this.configService.get('AWS_ACCESS_KEY_ID');
    const awsSecretKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
    
    this.useLocalStorage = !awsAccessKey || !awsSecretKey || awsAccessKey === '' || awsSecretKey === '';

    console.log('[ImageService] Initializing...', {
      useLocalStorage: this.useLocalStorage,
      awsConfigured: !this.useLocalStorage,
    });

    if (!this.useLocalStorage) {
      this.s3 = new S3({
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey,
        region: this.configService.get('AWS_REGION'),
      });
      console.log('[ImageService] Using AWS S3 storage');
    } else {
      // Setup local storage directory
      this.uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
        console.log('[ImageService] Created uploads directory:', this.uploadDir);
      }
      console.log('[ImageService] Using local file storage at:', this.uploadDir);
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    console.log('[ImageService] Upload request received:', {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      useLocalStorage: this.useLocalStorage,
    });

    // Generate a unique file name using UUID and original file name
    const fileName = `${uuid()}-${file.originalname}`;

    if (this.useLocalStorage) {
      try {
        // Save to local filesystem
        const filePath = path.join(this.uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        console.log('[ImageService] File saved to:', filePath);
        
        // Return a URL that can be served by the backend
        const port = this.configService.get('PORT') || '3002';
        const imageUrl = `http://localhost:${port}/uploads/${fileName}`;
        console.log('[ImageService] Returning URL:', imageUrl);
        return imageUrl;
      } catch (error) {
        console.error('[ImageService] Error saving file locally:', error);
        throw error;
      }
    } else {
      try {
        // Upload to S3
        const params = {
          Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const uploadResult = await this.s3.upload(params).promise();
        console.log('[ImageService] Uploaded to S3:', uploadResult.Location);
        return uploadResult.Location;
      } catch (error) {
        console.error('[ImageService] Error uploading to S3:', error);
        throw error;
      }
    }
  }

  async deleteImage(key: string): Promise<void> {
    console.log('[ImageService] Delete request received for:', key);
    
    if (this.useLocalStorage) {
      try {
        // Delete from local filesystem
        const fileName = path.basename(key);
        const filePath = path.join(this.uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('[ImageService] File deleted from:', filePath);
        } else {
          console.log('[ImageService] File not found:', filePath);
        }
      } catch (error) {
        console.error('[ImageService] Error deleting file locally:', error);
        throw error;
      }
    } else {
      try {
        // Delete from S3
        const params = {
          Bucket: this.configService.get('AWS_S3_BUCKET_NAME'),
          Key: key,
        };
        await this.s3.deleteObject(params).promise();
        console.log('[ImageService] File deleted from S3');
      } catch (error) {
        console.error('[ImageService] Error deleting from S3:', error);
        throw error;
      }
    }
  }
}
