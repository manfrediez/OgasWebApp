import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private from: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.from = this.configService.get<string>('EMAIL_FROM') || 'OGAS <onboarding@resend.dev>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not configured — emails will not be sent');
    }
  }

  async sendInviteEmail(to: string, firstName: string, inviteLink: string): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn(`Skipping invite email to ${to} — no API key`);
      return false;
    }

    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Te invitaron a OGAS',
        html: this.buildInviteHtml(firstName, inviteLink),
      });
      this.logger.log(`Invite email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send invite email to ${to}`, error);
      return false;
    }
  }

  private buildInviteHtml(firstName: string, inviteLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#E8F4F8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;padding:40px;">
        <tr><td>
          <h1 style="color:#1A3B4E;font-size:24px;margin:0 0 16px;">Hola ${firstName}!</h1>
          <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 24px;">
            Tu coach te invitó a unirte a <strong style="color:#2C5F7C;">OGAS</strong> para gestionar tu entrenamiento.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td>
            <a href="${inviteLink}"
               style="display:inline-block;background:#2C5F7C;color:#FFFFFF;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:bold;">
              Aceptar invitación
            </a>
          </td></tr></table>
          <p style="color:#666;font-size:13px;line-height:1.4;margin:0 0 8px;">
            Si el botón no funciona, copiá y pegá este link en tu navegador:
          </p>
          <p style="color:#2C5F7C;font-size:13px;word-break:break-all;margin:0 0 24px;">
            ${inviteLink}
          </p>
          <p style="color:#999;font-size:12px;margin:0;">
            Este link expira en 7 días.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
  }
}
