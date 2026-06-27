import { Column, Entity, PrimaryColumn } from 'typeorm';
import { jsonTransformer } from '../common/json-transformer';

@Entity('post')
export class Post {
  @PrimaryColumn('text')
  id: string;

  @Column('integer', { nullable: true })
  created_at?: number;

  @Column('integer', { nullable: true })
  updated_at?: number;

  @Column('text')
  channel_id: string;

  @Column('integer', { nullable: true })
  fetched_at?: number;

  @Column('integer', { nullable: true })
  published_at?: number;

  @Column('text', { nullable: true, transformer: jsonTransformer })
  content?: Record<string, any>;

  @Column('text', { nullable: true, transformer: jsonTransformer })
  attachment?: Record<string, any>;
}
