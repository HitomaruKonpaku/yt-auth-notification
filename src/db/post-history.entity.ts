import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { jsonTransformer } from '../common/json-transformer';

@Entity('post_history')
export class PostHistory {
  @PrimaryColumn('text')
  id: string;

  @Column('integer', { nullable: true })
  created_at?: number;

  @Column('integer', { nullable: true })
  updated_at?: number;

  @Index()
  @Column('text')
  post_id: string;

  @Index()
  @Column('text')
  key: string;

  @Column('text', { nullable: true })
  value_hash?: string;

  @Column('text', { nullable: true, transformer: jsonTransformer })
  value?: Record<string, any>;
}
