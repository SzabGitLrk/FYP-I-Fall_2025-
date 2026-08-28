import {
  Controller,
  Post,
  Patch,
  Body,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { TranslationService } from '../translation/translation.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly translationService: TranslationService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
  ): Promise<ApiResponse<{ access_token: string }>> {
    const lang = req.language;
    try {
      const token = await this.authService.login(loginDto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.auth.login.success',
          lang,
        ),
        data: token,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          success: false,
          message: this.translationService.getTranslation(
            'api.auth.login.error.invalidCredentials',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('signup')
  async signup(
    @Body() createUserDto: CreateUserDto,
    @Request() req: any,
  ): Promise<ApiResponse<{ access_token: string }>> {
    const lang = req.language;
    try {
      const token = await this.authService.signup(createUserDto);
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: this.translationService.getTranslation(
          'api.auth.signup.success',
          lang,
        ),
        data: token,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message:
            error.message ||
            this.translationService.getTranslation(
              'api.auth.signup.error.registrationFailed',
              lang,
            ),
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('password')
  @UseGuards(AuthGuard('jwt'))
  async updatePassword(
    @Request() req: any,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<ApiResponse<void>> {
    const userId = req.user.userId;
    const lang = req.language;
    try {
      await this.authService.updatePassword(userId, updatePasswordDto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.auth.password.success',
          lang,
        ),
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: this.translationService.getTranslation(
            'api.auth.password.error.updateFailed',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Request() req: any,
  ): Promise<ApiResponse<void>> {
    const lang = req.language;
    try {
      await this.authService.forgotPassword(forgotPasswordDto.email);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.auth.forgotPassword.success',
          lang,
        ),
      };
    } catch (error) {
      // Check if it's an email configuration error
      const isConfigError = error.message && (
        error.message.includes('email configuration') ||
        error.message.includes('Email service is not configured') ||
        error.message.includes('environment variables') ||
        error.message.includes('MAIL_')
      );
      
      const statusCode = isConfigError ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.INTERNAL_SERVER_ERROR;
      const errorMessage = isConfigError 
        ? 'Email service is not properly configured. Please contact support.'
        : this.translationService.getTranslation(
            'api.auth.forgotPassword.error',
            lang,
          );

      throw new HttpException(
        {
          statusCode,
          success: false,
          message: errorMessage,
          error: error.message,
        },
        statusCode,
      );
    }
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Request() req: any,
  ): Promise<ApiResponse<void>> {
    const lang = req.language;
    try {
      await this.authService.resetPassword(resetPasswordDto);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.auth.resetPassword.success',
          lang,
        ),
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: this.translationService.getTranslation(
            'api.auth.resetPassword.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('validate-reset-token')
  async validateResetToken(
    @Body() { email, resetToken }: ValidateResetTokenDto,
    @Request() req: any,
  ): Promise<ApiResponse<void>> {
    const lang = req.language;
    try {
      await this.authService.validateResetToken(email, resetToken);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: this.translationService.getTranslation(
          'api.auth.validate-reset-token.success',
          lang,
        ),
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: this.translationService.getTranslation(
            'api.auth.validate-reset-token.error',
            lang,
          ),
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
