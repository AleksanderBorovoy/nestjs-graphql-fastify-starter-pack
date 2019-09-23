import { EntityRepository, Repository } from 'typeorm';
import { User } from './user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import {
  InternalServerErrorException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import { SignCredentialsDto } from './dto/sign-credentials.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Logger } from '@nestjs/common';
@EntityRepository(User)
export class UserRepository extends Repository<User> {
  private logger = new Logger('UserRepository');

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const { username, email, password } = authCredentialsDto;
    const user = this.create();
    user.username = username;
    user.email = email;
    user.salt = await bcryptjs.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
      return user;
    } catch (error) {
      if (error.code === '23505') {
        this.logger.error(`${email} user is already exists`);
        throw new ConflictException('Email already exists');
      } else {
        this.logger.error(
          `Unable to save a new user: { email: ${email}, username: ${username}}`,
        );
        throw new InternalServerErrorException();
      }
    }
  }

  async validateUserPassword(signCredentialsDto: SignCredentialsDto) {
    const { email, password } = signCredentialsDto;
    const user = await this.findOne({ email });
    if (user && (await user.validatePassword(password))) {
      return user.email;
    } else {
      if (!user) {
        this.logger.error(`User ${email} has not been found`);
      } else {
        this.logger.error(`Password for ${email} user is invalid`);
      }
      return null;
    }
  }
  async changePassword(changePasswordDto: ChangePasswordDto) {
    const { email, password, newpassword } = changePasswordDto;
    const user = await this.findOne({ where: { email } });
    if (!user) {
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    }
    user.salt = await bcryptjs.genSalt();
    user.password = await this.hashPassword(newpassword, user.salt);
    try {
      await user.save();
      return user;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async setPassword(user: User, password: string) {
    user.salt = await bcryptjs.genSalt();
    user.password = await this.hashPassword(password, user.salt);
    user.resetPasswordExpires = null;
    user.resetPasswordToken = null;
    return user;
  }

  private async hashPassword(password: string, salt: string) {
    return bcryptjs.hash(password, salt);
  }
}
