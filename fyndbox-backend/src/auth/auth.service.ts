import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Scope,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { BaseService } from '../common/base.service';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { TranslationService } from '../translation/translation.service';
import { StorageService } from '../storage/storage.service';
import { BoxService } from '../box/box.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable({ scope: Scope.REQUEST })
export class AuthService extends BaseService {
  private mailTransporter;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private translationService: TranslationService,
    private storageService: StorageService,
    private boxService: BoxService,
  ) {
    super();
    
    // Initialize Nodemailer transporter
    const mailHost = process.env.MAIL_HOST;
    const mailPort = process.env.MAIL_PORT;
    const mailUser = process.env.MAIL_USER;
    const mailPassword = process.env.MAIL_PASSWORD;

    if (!mailHost || !mailPort || !mailUser || !mailPassword) {
      console.warn('Email configuration is incomplete. Email features will not work.');
      this.mailTransporter = null;
    } else {
      this.mailTransporter = nodemailer.createTransport({
        host: mailHost,
        port: Number(mailPort),
        secure: false, // true for 465, false for other ports
        auth: {
          user: mailUser,
          pass: mailPassword,
        },
      });
    }
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException(
        this.translationService.getTranslation(
          'api.auth.login.error.invalidCredentials',
          this.getLang(),
        ),
      );
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        this.translationService.getTranslation(
          'api.auth.login.error.accountInactive',
          this.getLang(),
        ),
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.translationService.getTranslation(
          'api.auth.login.error.invalidCredentials',
          this.getLang(),
        ),
      );
    }

    const payload = { email: user.email, sub: user.id }; // JWT payload
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signup(
    createUserDto: CreateUserDto,
  ): Promise<{ access_token: string }> {
    const existingUser = await this.userService
      .findByEmail(createUserDto.email)
      .catch(() => null);

    if (existingUser) {
      throw new BadRequestException(
        this.translationService.getTranslation(
          'api.auth.signup.error.emailAlreadyRegistered',
          this.getLang(),
        ),
      );
    }

    const newUser = await this.userService.create(createUserDto);

    // Automatically create a storage for the new user
    const defaultStorage = await this.storageService.create(
      {
        name: 'Garage',
        description: 'My Garage',
      },
      newUser.id,
    );

    // Automatically create a box within the created storage
    await this.boxService.create(
      {
        name: 'Låda 1',
        description: 'This is default box',
      },
      defaultStorage.id,
      newUser.id,
    );

    const frontendUrl = process.env.FRONTEND_URL;
    const mailFrom = process.env.MAIL_FROM;
    const productName = process.env.PRODUCT_NAME;

    if (!frontendUrl || !mailFrom || !productName) {
      console.warn('Email environment variables missing, skipping welcome email');
    } else if (this.mailTransporter) {
      const loginUrl = `${frontendUrl}/login`;

      try {
        await this.mailTransporter.sendMail({
          from: mailFrom,
          to: createUserDto.email,
          subject: `Welcome to ${productName}!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hello ${createUserDto.name},</h2>
              <p>Welcome to ${productName}! We're excited to have you on board.</p>
              <p>Your account has been successfully created with the email: <strong>${createUserDto.email}</strong></p>
              <p>You can now log in and start using ${productName}:</p>
              <a href="${loginUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Log In to ${productName}
              </a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <br>
              <p>Best regards,<br>The ${productName} Team</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail signup if email fails
      }
    }

    const payload = { email: newUser.email, sub: newUser.id };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const user = await this.userService.findOne(userId);

    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException(
        this.translationService.getTranslation(
          'api.auth.password.error.incorrectPassword',
          this.getLang(),
        ),
      );
    }

    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    await this.userService.update(userId, { password: hashedPassword });
  }

  async forgotPassword(email: string): Promise<void> {
    // Find user by email - will throw NotFoundException if not found
    const user = await this.userService.findByEmail(email).catch(() => {
      // For security, don't reveal if email exists or not
      // Just return success to prevent email enumeration
      return null;
    });

    // If user not found, return silently (security best practice)
    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // Token expires in 1 hour
    await this.userService.update(user.id, {
      resetToken,
      resetTokenExpiry: user.resetTokenExpiry,
    });

    const frontendUrl = process.env.FRONTEND_URL;
    const mailFrom = process.env.MAIL_FROM;
    const productName = process.env.PRODUCT_NAME;

    if (!frontendUrl || !mailFrom || !productName) {
      throw new Error(
        'FRONTEND_URL, MAIL_FROM, or PRODUCT_NAME is missing in environment variables',
      );
    }

    if (!this.mailTransporter) {
      throw new Error('Email service is not configured. Please check your email settings.');
    }

    // Generate the reset URL
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send the reset password email
    try {
      await this.mailTransporter.sendMail({
        from: mailFrom,
        to: email,
        subject: `Reset your ${productName} password`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${user.name || 'User'},</h2>
            <p>We received a request to reset your password for your ${productName} account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Reset Password
            </a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <br>
            <p>Best regards,<br>The ${productName} Team</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
          </div>
        `,
      });
    } catch (emailError) {
      // Log the email error but don't expose it to the user
      console.error('Failed to send password reset email:', emailError);
      throw new Error('Failed to send password reset email. Please check your email configuration.');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { email, resetToken, newPassword } = resetPasswordDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (!user.resetToken || user.resetToken !== resetToken) {
      throw new BadRequestException('Invalid reset token.');
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Reset token has expired.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userService.update(user.id, {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });
  }

  async validateResetToken(email: string, resetToken: string): Promise<void> {
    const user = await this.userService.findByEmail(email);

    if (
      !user ||
      user.resetToken !== resetToken ||
      user.resetTokenExpiry! < new Date()
    ) {
      throw new BadRequestException(
        this.translationService.getTranslation(
          'resetPassword.error.tokenInvalidOrUsed',
          this.getLang(),
        ),
      );
    }
  }
}
