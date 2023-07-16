import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UsersEntity } from './users.entity';
import { ESessionAuthType } from '../dto/session-auth.dto';

@Entity('sessions')
export class SessionsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 2500, nullable: false })
  jwt: string;

  @Column('enum', { enum: ESessionAuthType, default: ESessionAuthType.ANONYMOUS })
  type: ESessionAuthType;

  @Column('datetime', { nullable: false })
  expiredAt: Date;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => UsersEntity, (user) => user.sessions, {
    onDelete: 'CASCADE',
    onUpdate: 'RESTRICT',
    nullable: false,
    eager: true,
    cascade: true,
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id', foreignKeyConstraintName: 'fk_sessions_users' })
  users: UsersEntity[];
}
