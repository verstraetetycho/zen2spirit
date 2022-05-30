import { ApiProperty } from '@nestjs/swagger';
import { Validate, IsOptional } from 'class-validator';
import { User } from 'src/users/user.entity';
import { IsSpecialist } from 'src/users/users.validator';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Treatment } from 'src/treatments/treatment.entity';
import { CrudValidationGroups } from '@nestjsx/crud';
const { UPDATE } = CrudValidationGroups;

@Entity()
export class Profession {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  description: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.professions, { onDelete: 'SET NULL' })
  @Validate(IsSpecialist)
  @IsOptional({ groups: [UPDATE] })
  specialist: User;

  @OneToMany(() => Treatment, (treatment) => treatment.profession, {
    onDelete: 'SET NULL',
  })
  treatments: Treatment[];
}
