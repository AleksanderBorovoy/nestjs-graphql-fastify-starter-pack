import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import {
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import { User } from './user.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';
jest.mock('@nestjs/common/services/logger.service');
describe('UserRepository', () => {
  let userRepository;
  let user;
  let save;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile();
    userRepository = await module.get<UserRepository>(UserRepository);
  });

  user = new User();
  user.email = 'test@email.com';

  const mockUser = {
    id: 1,
    username: 'username1',
    email: 'userEmailmail.com',
  };
  const authCredentialsDto = {
    username: 'alexbor',
    email: 'alex@mail.com',
    password: 'Alex123',
  };
  const signCredentialsDto = {
    email: 'test@email.com',
    password: 'olololo',
  };
  const changePasswordDto = {
    email: 'test@email.ru',
    password: 'testPassword000',
    newpassword: 'TestPassword678',
  };

  it('should be defined', () => {
    expect(userRepository).toBeDefined();
  });

  describe('it should sign up user', () => {
    beforeEach(() => {
      save = jest.fn();
      userRepository.create = jest.fn().mockReturnValue({ save });
    });
    it('Should save user', () => {
      save.mockResolvedValue('user');
      expect(userRepository.signUp(authCredentialsDto)).resolves.not.toThrow();
    });
    it('throws a conflict exception as username already exists', () => {
      save.mockRejectedValue({ code: '23505' });
      expect(userRepository.signUp(authCredentialsDto)).rejects.toThrow(
        ConflictException,
      );
    });
    it('throws an internal server error if any other cases', () => {
      save.mockRejectedValue({ code: '23506' });
      expect(userRepository.signUp(authCredentialsDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      bcryptjs.hash = jest.fn().mockResolvedValue('hash');
      expect(bcryptjs.hash).not.toHaveBeenCalled();
      const result = await userRepository.hashPassword('user', 'salt');
      expect(bcryptjs.hash).toHaveBeenCalledWith('user', 'salt');
      expect(result).toEqual('hash');
    });
  });

  describe('validate password', () => {
    beforeEach(() => {
      userRepository.findOne = jest.fn();
      user.validatePassword = jest.fn();
    });
    it('should validate users password', async () => {
      userRepository.findOne.mockReturnValue(user);
      user.validatePassword.mockReturnValue(true);
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(user.validatePassword).not.toHaveBeenCalled();
      const result = await userRepository.validateUserPassword(
        signCredentialsDto,
      );
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(user.validatePassword).toHaveBeenCalled();
      expect(result).toEqual('test@email.com');
    });
    it('should return null if user does not exist', async () => {
      userRepository.findOne.mockReturnValue(null);
      expect(userRepository.findOne).not.toHaveBeenCalled();
      const result = await userRepository.validateUserPassword(
        signCredentialsDto,
      );
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual(null);
    });
    it('should return null if password is wrong', async () => {
      userRepository.findOne.mockReturnValue(user);
      user.validatePassword.mockReturnValue(false);
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(user.validatePassword).not.toHaveBeenCalled();
      const result = await userRepository.validateUserPassword(
        signCredentialsDto,
      );
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(user.validatePassword).toHaveBeenCalled();
      expect(result).toEqual(null);
    });
  });

  describe('Change password', () => {
    beforeEach(() => {
      userRepository.findOne = jest.fn();
      user.validatePassword = jest.fn();
      save = jest.fn();
    });
    it('should find user', async () => {
      userRepository.findOne.mockReturnValue({ save });
      expect(userRepository.findOne).not.toHaveBeenCalled();
      const result = await userRepository.changePassword(changePasswordDto);
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(result.save).not.toThrow();
    });
    it('should reject with http bad request if user not found', async () => {
      userRepository.findOne.mockReturnValue(null);
      expect(userRepository.changePassword(changePasswordDto)).rejects.toThrow(
        HttpException,
      );
    });
    it('should reject if the save function is failed', () => {
      save.mockRejectedValue(InternalServerErrorException);
      userRepository.findOne.mockReturnValue({ save });
      expect(userRepository.changePassword(changePasswordDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('setPassword', () => {
    it('should set new password', async () => {
      userRepository.hashPassword = jest.fn().mockResolvedValue('hash');
      expect(userRepository.hashPassword).not.toHaveBeenCalled();
      const resetPasswordDto: ResetPasswordDto = {
        password: 'oldPassword',
      };
      const result = await userRepository.setPassword(
        mockUser,
        resetPasswordDto.password,
      );
      expect(userRepository.hashPassword).toHaveBeenCalled();
      expect(result.password).toEqual('hash');
    });
  });
});
