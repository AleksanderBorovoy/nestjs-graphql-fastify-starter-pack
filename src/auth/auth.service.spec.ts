import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import {
  UnauthorizedException,
  HttpException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nest-modules/mailer';
jest.mock('@nestjs/common/services/logger.service');
const mockAuthRepository = () => ({
  signUp: jest.fn(),
  validateUserPassword: jest.fn(),
  changePassword: jest.fn(),
  findOne: jest.fn(),
  setPassword: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});
const mockMailerService = () => ({
  sendMail: jest.fn(),
});

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository;
  let jwtService;
  let mailerService;
  let save;
  save = jest.fn();
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useFactory: mockAuthRepository },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: MailerService, useFactory: mockMailerService },
      ],
    }).compile();

    authService = await module.get<AuthService>(AuthService);
    userRepository = await module.get<UserRepository>(UserRepository);
    jwtService = await module.get<JwtService>(JwtService);
    mailerService = await module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
  describe('SignUp', () => {
    it('should register user', async () => {
      userRepository.signUp.mockReturnValue('token');
      expect(userRepository.signUp).not.toHaveBeenCalled();
      const authCredentialsDto = {
        username: 'Alexandr',
        email: 'rap-rus@inbox.ru',
        password: 'Password31',
      };
      const result = await authService.signUp(authCredentialsDto);
      expect(userRepository.signUp).toHaveBeenCalled();
      expect(result).toEqual('token');
    });
  });
  describe('Sign in', () => {
    const signCredentialsDto = {
      email: 'mrsahsmartini@gmail.com',
      password: 'Alexandr135',
    };
    it('should validate user password', async () => {
      userRepository.validateUserPassword.mockReturnValue('token');
      expect(userRepository.validateUserPassword).not.toHaveBeenCalled();
      const result = await authService.signIn(signCredentialsDto);
      expect(userRepository.validateUserPassword).toHaveBeenCalled();
    });
    it('Should throw Unauthorized exception if user isnt found', async () => {
      userRepository.validateUserPassword.mockResolvedValue(null);
      expect(userRepository.validateUserPassword).not.toHaveBeenCalled();
      expect(authService.signIn(signCredentialsDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('should return access token', async () => {
      userRepository.validateUserPassword.mockReturnValue('email');

      jwtService.sign.mockResolvedValue('accessToken');
      expect(jwtService.sign).not.toHaveBeenCalled();
      const result = await authService.signIn(signCredentialsDto);
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual('accessToken');
    });
  });
  describe('Change password', () => {
    const changePasswordDto = {
      email: 'test@email.ru',
      password: 'testPassword000',
      newpassword: 'TestPassword678',
    };
    it('should validate password', async () => {
      userRepository.validateUserPassword.mockReturnValue('user');
      userRepository.changePassword.mockReturnValue('user');
      expect(userRepository.validateUserPassword).not.toHaveBeenCalled();
      expect(userRepository.changePassword).not.toHaveBeenCalled();
      const email = await authService.changePassword(changePasswordDto);
      expect(userRepository.validateUserPassword).toHaveBeenCalledWith(
        changePasswordDto,
      );
      expect(email).toEqual('user');
      expect(userRepository.changePassword).toHaveBeenCalled();
    });
    it('should throw an error if password is wrong', () => {
      userRepository.validateUserPassword.mockReturnValue(null);
      expect(authService.changePassword(changePasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
  describe('Forgot password dto', () => {
    it('should find user', async () => {
      userRepository.findOne.mockReturnValue({ save });
      mailerService.sendMail.mockResolvedValue('sent');
      expect(userRepository.findOne).not.toHaveBeenCalled();
      const forgotPasswordDto = { email: 'test@email.com' };
      await authService.forgotPassword(forgotPasswordDto);
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(userRepository.findOne).not.toThrow();
    });
    it('should throw an error if user not found', async () => {
      userRepository.findOne.mockReturnValue(null);
      expect(userRepository.findOne).not.toHaveBeenCalled();
      const forgotPasswordDto = { email: 'test@email.com' };
      expect(authService.forgotPassword(forgotPasswordDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('Reset password', () => {
    const setPasswordDto = {
      token: '3WnpLoonCgPEFdeyRD8UqS4WXCUPZnDaqBU5lpJNKTP',
      newpassword: 'NewPassword78',
    };
    it('should reset password', async () => {
      userRepository.findOne.mockReturnValue('user');
      save.mockResolvedValue(true);
      userRepository.setPassword.mockReturnValue({ setpassword: 'save', save });
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.setPassword).not.toHaveBeenCalled();
      const result = await authService.resetPassword(setPasswordDto);
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(userRepository.setPassword).toHaveBeenCalled();
      expect(result).toEqual(true);
    });
    it('should throw  internal server error exception', () => {
      save.mockRejectedValue(false);
      userRepository.findOne.mockReturnValue('user');
      userRepository.setPassword.mockReturnValue({ setpassword: 'save', save });
      expect(authService.resetPassword(setPasswordDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
    it('should throw an error if token is invalid', async () => {
      userRepository.findOne.mockReturnValue(null);
      expect(authService.resetPassword(setPasswordDto)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
