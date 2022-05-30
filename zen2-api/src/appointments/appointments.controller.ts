import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Headers,
  Request,
  Get,
  Query,
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
import { MailService } from 'src/mail/mail.service';
import { Role, User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';

@ApiTags('appointments')
@Crud({
  model: {
    type: Appointment,
  },
  query: {
    join: {
      treatment: {
        eager: true,
      },
      patient: {
        eager: true,
        exclude: ['password', 'verified', 'createdAt'],
      },
      specialist: {
        eager: true,
        exclude: ['password', 'verified', 'createdAt'],
      },
      scheduledBy: {
        eager: true,
        exclude: ['password', 'verified', 'createdAt'],
      },
    },
  },
})
@Controller('appointments')
export class AppointmentsController implements CrudController<Appointment> {
  constructor(
    public service: AppointmentsService,
    private authService: AuthService,
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  get base(): CrudController<Appointment> {
    return this;
  }

  @Override()
  async getMany(@ParsedRequest() req: CrudRequest, @Headers() headers) {
    const authHeader = headers.authorization;
    const token = authHeader.replace('Bearer ', '');
    const email = await this.authService.verifyAccessToken(token);
    const user = await this.usersService.findByEmail(email);
    if (user.role === Role.Patient) {
      req.options.query.filter = { 'Appointment.patientId': user.id };
    } else {
      req.options.query.filter = { 'Appointment.specialistId': user.id };
    }
    return this.base.getManyBase(req);
  }

  @Override()
  async getOne(@ParsedRequest() req: CrudRequest, @Headers() headers) {
    const authHeader = headers.authorization;
    const token = authHeader.replace('Bearer ', '');
    const email = await this.authService.verifyAccessToken(token);
    const user = await this.usersService.findByEmail(email);
    if (user.role === Role.Patient) {
      req.options.query.filter = { 'Appointment.patientId': user.id };
    } else {
      req.options.query.filter = { 'Appointment.specialistId': user.id };
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

  @Override()
  async createOne(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: Appointment,
  ) {
    // create a new Appointment
    const checked = await this.service.createAppointment(dto);
    let appointment: Appointment;
    switch (checked) {
      case 'create':
        console.log('create');

        appointment = await this.base.createOneBase(req, dto);
        break;
      case 'start > end':
        throw new BadRequestException(
          `You can't create an appointment with the start date after the end date`,
        );
        break;
      case 'date less now':
        throw new BadRequestException(
          `You can't create an appointment that is in the past`,
        );
        break;
      case 'date less 24':
        throw new BadRequestException(
          `You can't create an appointment less than 24 hours before the appointment`,
        );
        break;
      case 'not found':
        throw new NotFoundException(`Appointment not found`);
        break;
      default:
        break;
    }
    // send mail that to both asker & receiver
    console.log(appointment);

    const asker: User = appointment.scheduledBy;
    let receiver: User;
    if (appointment.scheduledBy === appointment.patient) {
      receiver = appointment.specialist;
    } else {
      receiver = appointment.patient;
    }
    this.mailService.sendCreatedAppointmentToAsker(
      asker,
      receiver,
      appointment,
    );
    // asker will get a confirmation message that the appointment has been created but not yet confirmed
    // receiver will have to confirm if the appointment fits into his agenda
    this.mailService.sendCreatedAppointmentToReceiver(
      asker,
      receiver,
      appointment,
    );
  }

  @Get(':id/approve')
  async approveAppointment(@Param('id') id: number, @Query() query) {
    const approved = await this.service.approveAppointment(id);
    if (approved === false) {
      throw new NotFoundException(`Appointment not found`);
    }
    return approved;
  }

  @Get(':id/cancel')
  async cancelAppointment(@Param('id') id: number, @Query() query) {
    const canceled = await this.service.cancelAppointment(id);
    switch (canceled) {
      case 'date less now':
        throw new BadRequestException(
          `You can't cancel an appointment that is in the past`,
        );
        break;
      case 'date less 24':
        throw new BadRequestException(
          `You can't cancel an appointment less than 24 hours before the appointment`,
        );
        break;
      case 'not found':
        throw new NotFoundException(`Appointment not found`);
        break;
      default:
        break;
    }
    return canceled;
  }
}
