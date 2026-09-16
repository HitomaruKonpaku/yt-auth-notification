import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('notification')
export class Notification {
  @PrimaryColumn('text')
  id: string;

  @Column('integer', { nullable: true })
  created_at?: number;

  @Column('integer', { nullable: true })
  updated_at?: number;

  @Column('integer')
  sent_at: number;

  @Column('text', { nullable: true })
  owner_id?: string;

  @Column('text', { nullable: true })
  video_id?: string;

  @Column('text', { nullable: true })
  post_id?: string;

  @Column('text', { nullable: true })
  linked_comment_id?: string;

  @Column('text', { nullable: true })
  endpoint_url?: string;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  thumbnail_url?: string;
}
