import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Storage } from '../storage/storage.entity';
import { Item } from '../item/item.entity';

@Entity()
export class Box {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string; // Stores the image as a URL or path

  @Column({ default: false })
  isFavorite: boolean;

  // Foreign key relation to the Storage entity
  @ManyToOne(() => Storage, (storage) => storage.boxes, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'storageId' }) // Explicitly set the foreign key column name
  storage: Storage;

  @Column({ type: 'uuid' })
  storageId: string; // Explicit foreign key column to store the storageId

  // One-to-many relation with the Item entity
  @OneToMany(() => Item, (item) => item.box)
  items: Item[]; // A box can have multiple items

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
