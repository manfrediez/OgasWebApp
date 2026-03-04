import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { fromBuffer } from 'file-type';
import * as fs from 'fs';

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

// doc/docx magic bytes aren't reliably detected by file-type;
// they'll be allowed through if extension/MIME matched at upload
const DOCUMENT_EXTENSIONS = new Set(['.doc', '.docx']);

@Injectable()
export class FileMagicValidationPipe implements PipeTransform {
  async transform(files: Express.Multer.File[]): Promise<Express.Multer.File[]> {
    if (!files || files.length === 0) return files;

    for (const file of files) {
      const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
      if (DOCUMENT_EXTENSIONS.has(ext)) continue;

      const buffer = fs.readFileSync(file.path);
      const type = await fromBuffer(buffer);

      if (!type || !ALLOWED_MIMES.has(type.mime)) {
        // Remove the invalid file from disk
        fs.unlinkSync(file.path);
        throw new BadRequestException(
          `El archivo "${file.originalname}" no tiene un contenido válido para su tipo`,
        );
      }
    }

    return files;
  }
}
