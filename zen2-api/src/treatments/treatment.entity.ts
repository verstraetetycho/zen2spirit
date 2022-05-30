import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Validate } from 'class-validator';
import { IsSpecialist } from 'src/users/users.validator';
import { User } from 'src/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Appointment } from 'src/appointments/appointment.entity';
import { Profession } from 'src/professions/profession.entity';
import { CrudValidationGroups } from '@nestjsx/crud';
const { UPDATE } = CrudValidationGroups;

@Entity()
export class Treatment {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.treatments, { onDelete: 'SET NULL' })
  @Validate(IsSpecialist)
  specialist: User;

  @ApiProperty()
  @IsString()
  @Column({ unique: true })
  name: string;

  @ApiProperty()
  @IsString()
  @Column()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Column()
  duration: number;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Column()
  price: number;

  @ApiProperty({ type: () => Profession })
  @ManyToOne(() => Profession, (profession) => profession.treatments, {
    onDelete: 'SET NULL',
  })
  @IsOptional({ groups: [UPDATE] })
  profession: Profession;

  @OneToMany(() => Appointment, (appointment) => appointment.treatment, {
    onDelete: 'SET NULL',
  })
  appointments: Appointment[];
}
