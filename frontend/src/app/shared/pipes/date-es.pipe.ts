import { Pipe, PipeTransform } from '@angular/core';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

@Pipe({ name: 'dateEs', standalone: true })
export class DateEsPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, fmt: string = 'dd/MM/yyyy'): string {
    if (!value) return '';
    const date = typeof value === 'string' ? parseISO(value) : value;
    return format(date, fmt, { locale: es });
  }
}
