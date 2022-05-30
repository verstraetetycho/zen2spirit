import { Controller, Get, Headers, Param, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  Crud,
  CrudController,
  CrudRequest,
  Override,
  ParsedRequest,
} from '@nestjsx/crud';
import { AuthService } from 'src/auth/auth.service';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { Profession } from './profession.entity';
import { ProfessionsService } from './professions.service';

@ApiTags('professions')
@Crud({
  model: {
    type: Profession,
  },
  query: {
    join: {
      specialist: {
        eager: true,
        exclude: ['password', 'verified', 'createdAt'],
      },
    },
  },
})
@Controller('professions')
export class ProfessionsController implements CrudController<Profession> {
  constructor(
    public service: ProfessionsService,
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  get base(): CrudController<Profession> {
    return this;
  }

  @Roles(Role.Patient, Role.Specialist, Role.Admin)
  @Override()
  async getMany(@ParsedRequest() req: CrudRequest, @Headers() headers) {
    const authHeader = headers.authorization;
    const token = authHeader.replace('Bearer ', '');
    const email = await this.authService.verifyAccessToken(token);
    const user = await this.usersService.findByEmail(email);
    if (user.role === Role.Specialist) {
      req.options.query.filter = { 'Profession.specialistId': user.id };
    }
    return this.base.getManyBase(req);
  }

  @Roles(Role.Patient, Role.Specialist, Role.Admin)
  @Override()
  async getOne(@ParsedRequest() req: CrudRequest, @Headers() headers) {
    const authHeader = headers.authorization;
    const token = authHeader.replace('Bearer ', '');
    const email = await this.authService.verifyAccessToken(token);
    const user = await this.usersService.findByEmail(email);
    if (user.role === Role.Specialist) {
      req.options.query.filter = { 'Profession.specialistId': user.id };
    }
    return this.base.getOneBase(req);
  }

  @Roles(Role.Patient, Role.Specialist, Role.Admin)
  @Get('specialist/:specialistId')
  async getBySpecialistId(
    @Request() req,
    @Param('specialistId') specialistId: string,
  ) {
    return this.service.find({
      where: { specialist: { id: specialistId } },
    });
  }

  @Roles(Role.Specialist, Role.Admin)
  @Override()
  createOne(@ParsedRequest() req: CrudRequest, dto: Profession) {
    return this.base.createOneBase(req, dto);
  }

  @Roles(Role.Specialist, Role.Admin)
  @Override()
  updateOne(@ParsedRequest() req: CrudRequest, dto: Profession) {
    return this.base.updateOneBase(req, dto);
  }

  @Roles(Role.Specialist, Role.Admin)
  @Override()
  deleteOne(@ParsedRequest() req: CrudRequest) {
    return this.base.deleteOneBase(req);
  }
}
