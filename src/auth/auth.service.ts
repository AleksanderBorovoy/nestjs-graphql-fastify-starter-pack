import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from './user.repository';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { User } from './user.entity';
import { SignCredentialsDto } from './dto/sign-credentials.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import * as tokenGenerator from 'uuid-token-generator';
import { MailerService } from '@nest-modules/mailer';
import { MoreThan } from 'typeorm';
import { SetPasswordDto } from './dto/set-password.dto';
import { Logger } from '@nestjs/common';
@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    return await this.userRepository.signUp(authCredentialsDto);
  }

  async signIn(signCredentialsDto: SignCredentialsDto): Promise<string> {
    const email = await this.userRepository.validateUserPassword(
      signCredentialsDto,
    );
    if (!email) {
      this.logger.error(`Invalid credentials for ${signCredentialsDto.email}`);
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload: JwtPayload = { email };
    const accessToken = await this.jwtService.sign(payload);
    return accessToken;
  }

  async changePassword(changePasswordDto: ChangePasswordDto): Promise<User> {
    const email = await this.userRepository.validateUserPassword(
      changePasswordDto,
    );
    if (!email) {
      this.logger.error(
        `Failed to change password for user "${changePasswordDto.email}"`,
      );
      throw new UnauthorizedException('invalid credentials');
    }
    const user = await this.userRepository.changePassword(changePasswordDto);
    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });
    if (!user) {
      this.logger.error(
        `User with ${forgotPasswordDto.email} email has not been found.`,
      );
      throw new NotFoundException('Email not found.');
    }
    const tokenGen = new tokenGenerator(256, tokenGenerator.BASE62);
    user.resetPasswordToken = await tokenGen.generate();
    user.resetPasswordExpires = new Date(new Date().getTime() + 3600000);
    user.save();
    try {
      const result = await this.mailerService.sendMail({
        to: `${forgotPasswordDto.email}`, // sender address
        from: 'rap-rus@inbox.ru', // list of receivers
        subject: 'your password reset link', // Subject line
        text: 'welcome', // plaintext body
        html:
          '<a href="http:/localhost:3000/user/reset/' +
          user.resetPasswordToken +
          '">click here to reset password</a>', // HTML body content
      });
      return 'reset password link has been sent';
    } catch (error) {
      this.logger.error(
        `Unable to send reset password email to ${user.email}. Error: ${
          error.message
        }`,
      );
      throw new InternalServerErrorException();
    }
  }
  async resetPassword(setPasswordDto: SetPasswordDto): Promise<User> {
    let user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: setPasswordDto.token,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });
    if (!user) {
      this.logger.error(`Token ${setPasswordDto.token} has not been found.`);
      throw new HttpException(
        'reset password link expired',
        HttpStatus.BAD_REQUEST,
      );
    }
    user = await this.userRepository.setPassword(
      user,
      setPasswordDto.newpassword,
    );

    try {
      const result = await user.save();
      return result;
    } catch (error) {
      this.logger.error(
        `Unable to save update ${user.email} user after changing the password.`,
      );
      throw new InternalServerErrorException();
    }
  }
}
