import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  Crud,
  CrudController,
  CrudRequest,
  Override,
  ParsedBody,
  ParsedRequest,
} from '@nestjsx/crud';
import { AuthService } from 'src/auth/auth.service';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { Treatment } from './treatment.entity';
import { TreatmentsService } from './treatments.service';

@ApiTags('treatments')
@Crud({
  model: {
    type: Treatment,
  },
  query: {
    join: {
      specialist: {
        eager: true,
        exclude: ['password', 'verified', 'createdAt'],
      },
      profession: {
        eager: true,
        allow: ['id', 'name'],
      },
    },
  },
})
@Controller('treatments')
export class TreatmentsController implements CrudController<Treatment> {
  constructor(
    public service: TreatmentsService,
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  get base(): CrudController<Treatment> {
    return this;
  }

  @Roles(Role.Patient, Role.Specialist)
  @Override()
  async getMany(@ParsedRequest() req: CrudRequest, @Headers() headers) {
    const authHeader = headers.authorization;
    const token = authHeader.replace('Bearer ', '');
    const email = await this.authService.verifyAccessToken(token);
    const user = await this.usersService.findByEmail(email);
    if (user.role === Role.Specialist) {
      req.options.query.filter = { 'Treatment.specialistId': user.id };
    }
    return this.base.getManyBase(req);
  }

  @Roles(Role.Patient, Role.Specialist)
  @Override()
  async getOne(@ParsedRequest() req: CrudRequest, @Headers() headers) {
    const authHeader = headers.authorization;
    const token = authHeader.replace('Bearer ', '');
    const email = await this.authService.verifyAccessToken(token);
    const user = await this.usersService.findByEmail(email);
    if (user.role === Role.Specialist) {
      req.options.query.filter = { 'Treatment.specialistId': user.id };
    }
    return this.base.getOneBase(req);
  }

  @Roles(Role.Patient, Role.Specialist)
  @Get('specialist/:specialistId')
  async getBySpecialistId(
    @Request() req,
    @Param('specialistId') specialistId: string,
  ) {
    return this.service.find({
      where: { specialist: { id: specialistId } },
    });
  }

  @Roles(Role.Patient, Role.Specialist)
  @Get('profession/:professionId')
  async getByProfessionId(
    @Request() req,
    @Param('professionId') professionId: string,
  ) {
    return this.service.find({
      where: { profession: { id: professionId } },
    });
  }

  @Roles(Role.Specialist)
  @Override()
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: Treatment,
  ) {
    return await this.base.createOneBase(req, dto).catch((err) => {
      throw new BadRequestException(err.message);
    });
  }
}
