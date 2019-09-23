import * as bcryptjs from 'bcryptjs';
import {
  Entity,
  Unique,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity()
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({
    type: 'timestamptz',
    default: null,
    nullable: true,
  })
  resetPasswordExpires: Date;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  salt: string;

  async validatePassword(password: string) {
    const hash = await bcryptjs.hash(password, this.salt);
    return hash === this.password;
  }
}
