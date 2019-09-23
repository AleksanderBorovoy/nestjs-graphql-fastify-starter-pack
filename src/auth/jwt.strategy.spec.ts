import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { JwtStrategy } from './jwt.strategy';
import { User } from './user.entity';
import { UnauthorizedException } from '@nestjs/common';
jest.mock('@nestjs/common/services/logger.service');
const mockUserRepository = () => ({
  findOne: jest.fn(),
});
describe('JwtStrategy', () => {
  let userRepository;
  let jwtStrategy;

  const user = new User();
  const payload = { email: 'email@gmail.com' };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UserRepository, useFactory: mockUserRepository },
      ],
    }).compile();

    userRepository = await module.get<UserRepository>(UserRepository);
    jwtStrategy = await module.get<JwtStrategy>(JwtStrategy);
  });
  it('should be defined', () => {
    expect(JwtStrategy).toBeDefined();
  });
  it('should validate payload', async () => {
    userRepository.findOne.mockReturnValue(user);
    expect(userRepository.findOne).not.toHaveBeenCalled();
    const result = await jwtStrategy.validate(payload);
    expect(userRepository.findOne).toHaveBeenCalled();
    expect(userRepository.findOne).toHaveBeenCalledWith(payload);
    expect(result).toEqual(user);
  });
  it('should throw Unauthorized Exception if payload wrong', async () => {
    userRepository.findOne.mockResolvedValue(null);
    expect(userRepository.findOne).not.toHaveBeenCalled();
    expect(jwtStrategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
