import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Box } from '../box/box.entity';

@Entity()
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string; // Stores the image as a URL or path

  @Column({ type: 'int', nullable: true, default: 1 }) // Quantity field, optional, defaults to 1
  quantity?: number;

  // Foreign key relation to the Storage entity
  @ManyToOne(() => Box, (box) => box.items, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'boxId' }) // Explicitly set the foreign key column name
  box: Box;

  @Column({ type: 'uuid' })
  boxId: string; // Explicit foreign key column to store the storageId

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
