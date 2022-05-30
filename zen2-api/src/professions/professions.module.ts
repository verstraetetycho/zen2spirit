import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { Profession } from './profession.entity';
import { ProfessionsController } from './professions.controller';
import { ProfessionsService } from './professions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Profession]), AuthModule, UsersModule],
  providers: [ProfessionsService],
  controllers: [ProfessionsController],
})
export class ProfessionsModule {}
