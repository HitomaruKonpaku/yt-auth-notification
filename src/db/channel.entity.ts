import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('channel')
export class Channel {
  @PrimaryColumn('text')
  id: string;

  @Column('integer', { nullable: true })
  created_at?: number;

  @Column('integer', { nullable: true })
  updated_at?: number;

  @Column('text', { nullable: true })
  handle?: string;

  @Column('text', { nullable: true })
  name?: string;

  @Column('text', { nullable: true })
  thumbnail_url?: string;
}
