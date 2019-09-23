import { User } from './user.entity';
import * as bcryptjs from 'bcryptjs';

describe('User entity', () => {
  let user: User;
  beforeEach(() => {
    bcryptjs.hash = jest.fn();
    user = new User();
    user.password = 'UserPassword777';
    user.salt = 'userSalt';
  });
  it('should validate user password', async () => {
    bcryptjs.hash.mockReturnValue('UserPassword777');
    expect(bcryptjs.hash).not.toHaveBeenCalled();
    const result = await user.validatePassword('UserPassword777');
    expect(bcryptjs.hash).toHaveBeenCalledWith('UserPassword777', 'userSalt');
    expect(result).toEqual(true);
  });
  it('should return false if password is invalid', async () => {
    bcryptjs.hash.mockReturnValue('invalidpassword');
    expect(bcryptjs.hash).not.toHaveBeenCalled();
    const result = await user.validatePassword('invalidPassword');
    expect(bcryptjs.hash).toHaveBeenCalledWith('invalidPassword', 'userSalt');
    expect(result).toEqual(false);
  });
});
