import {
  Controller,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { ImportService } from './import.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('athlete/:athleteId/excel')
  @Roles(Role.COACH)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (
          !file.originalname.toLowerCase().endsWith('.xlsx') ||
          file.mimetype !==
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
          return cb(
            new BadRequestException(
              'Solo se permiten archivos Excel (.xlsx)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async importExcel(
    @Param('athleteId') athleteId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') coachId: string,
    @CurrentUser('role') role: string,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo no proporcionado');
    }
    return this.importService.importFromExcel(
      file.buffer,
      athleteId,
      coachId,
      role,
    );
  }
}
