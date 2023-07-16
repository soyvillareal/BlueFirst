import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import bcrypt from 'bcryptjs';

import { DEFAULT_AVATAR } from 'src/common/constants';

import { EUserGender } from '../dto/register-auth.dto';
import { SessionsEntity } from './sessions.entity';

@Entity('users')
export class UsersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 25, unique: true, nullable: false, collation: 'utf8mb3_general_ci' })
  username: string;

  @Column({ type: 'varchar', length: 320, unique: true, nullable: false, collation: 'ascii_general_ci' })
  email: string;

  @Column({ type: 'varchar', length: 60, nullable: false })
  password: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 100, default: DEFAULT_AVATAR, nullable: true, collation: 'ascii_general_ci' })
  avatar: string;

  @Column('datetime', { nullable: true, default: null })
  birthdate: Date;

  @Column('enum', { enum: EUserGender, default: EUserGender.MALE })
  gender: EUserGender;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => SessionsEntity, (session) => session.users)
  sessions: SessionsEntity[];

  @BeforeUpdate()
  @BeforeInsert()
  async hashPassword() {
    const passwordHashed = await bcrypt.hash(this.password, 10);
    this.password = passwordHashed;
  }
}
