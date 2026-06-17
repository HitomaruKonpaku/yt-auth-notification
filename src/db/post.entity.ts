import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('post')
export class Post {
  @PrimaryColumn('text')
  post_id: string;

  @Column('text')
  channel_id: string;

  @Column('integer', { nullable: true })
  created_at?: number;

  @Column('integer', { nullable: true })
  updated_at?: number;
}
