import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Profession } from './profession.entity';

@Injectable()
export class ProfessionsService extends TypeOrmCrudService<Profession> {
  constructor(@InjectRepository(Profession) repo) {
    super(repo);
  }
}
