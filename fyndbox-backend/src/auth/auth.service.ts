import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Scope,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as postmark from 'postmark';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { BaseService } from '../common/base.service';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { TranslationService } from 'src/translation/translation.service';
import { StorageService } from 'src/storage/storage.service';
import { BoxService } from 'src/box/box.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable({ scope: Scope.REQUEST })
export class AuthService extends BaseService {
  private postmarkClient;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private translationService: TranslationService,
    private storageService: StorageService,
    private boxService: BoxService,
  ) {
    super();
    const postmarkApiKey = process.env.POSTMARK_API_KEY;
    if (!postmarkApiKey) {
      throw new Error('POSTMARK_API_KEY is not set in environment variables');
    }
    this.postmarkClient = new postmark.ServerClient(postmarkApiKey);
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
    const fromEmail = process.env.POSTMARK_FROM_EMAIL;
    const templateId = process.env.POSTMARK_WELCOME_TEMPLATE_ID;
    const productName = process.env.PRODUCT_NAME;

    if (!frontendUrl || !fromEmail || !templateId || !productName) {
      throw new Error(
        'FRONTEND_URL, POSTMARK_FROM_EMAIL, PRODUCT_NAME, or POSTMARK_WELCOME_TEMPLATE_ID is missing in environment variables',
      );
    }

    // login URL
    const loginUrl = `${frontendUrl}/login`;

    await this.postmarkClient.sendEmailWithTemplate({
      From: fromEmail,
      To: createUserDto.email,
      TemplateId: parseInt(templateId, 10),
      TemplateModel: {
        name: createUserDto.name,
        email: createUserDto.email,
        product_name: productName,
        product_url: frontendUrl,
        login_url: loginUrl,
        company_name: productName,
        company_address: fromEmail,
      },
    });

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
    const user = await this.userService.findByEmail(email);

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // Token expires in 1 hour
    await this.userService.update(user.id, {
      resetToken,
      resetTokenExpiry: user.resetTokenExpiry,
    });

    const frontendUrl = process.env.FRONTEND_URL;
    const fromEmail = process.env.POSTMARK_FROM_EMAIL;
    const templateId = process.env.POSTMARK_FORGOT_PASSWORD_TEMPLATE_ID;
    const productName = process.env.PRODUCT_NAME;

    if (!frontendUrl || !fromEmail || !templateId) {
      throw new Error(
        'FRONTEND_URL, POSTMARK_FROM_EMAIL, PRODUCT_NAME, or POSTMARK_FORGOT_PASSWORD_TEMPLATE_ID is missing in environment variables',
      );
    }
    // Generate the reset URL
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send the reset password email
    await this.postmarkClient.sendEmailWithTemplate({
      From: fromEmail,
      To: email,
      TemplateId: parseInt(templateId, 10),
      TemplateModel: {
        name: user.name || 'User',
        action_url: resetUrl,
        company_name: productName,
        product_name: productName,
        product_url: frontendUrl,
        company_address: fromEmail,
      },
    });
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
