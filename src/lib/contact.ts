import { z } from 'zod';
import { type Locale, t } from './i18n';

/** Schema del modulo contatti, con i messaggi d'errore nella lingua della pagina. */
export function contactSchema(locale: Locale) {
  const ui = t(locale).form;
  const req = (label: string) =>
    z
      .string({ error: ui.fieldRequired(label) })
      .trim()
      .min(1, ui.fieldRequired(label));
  return z.object({
    name: req(ui.name).max(120),
    email: z.email({ error: ui.invalidEmail }),
    phone: z.string().trim().max(40).optional().default(''),
    message: req(ui.message).min(10, ui.messageTooShort).max(5000),
    privacy: z.literal('on', { error: ui.consentRequired }),
  });
}

export type Contact = z.infer<ReturnType<typeof contactSchema>>;

export function formDataToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === 'string') out[k] = v;
  return out;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );

/** Email per chi gestisce il sito (sempre in inglese, con la lingua da cui è arrivato il messaggio). */
export function renderEmail(
  data: Contact,
  meta: { ip?: string; receivedAt: Date; locale: Locale },
) {
  const when = meta.receivedAt.toLocaleString('en-GB', { timeZone: 'Europe/Rome' });
  const rows: [string, string][] = [
    ['Name', data.name],
    ['Email', data.email],
    ['Phone', data.phone || '—'],
    ['Message', data.message],
    ['Language', meta.locale],
  ];
  const text = [
    'NEW MESSAGE FROM THE WEBSITE',
    '',
    ...rows.map(([l, v]) => `${l}: ${v}`),
    '',
    `Received ${when}${meta.ip ? ` · IP ${meta.ip}` : ''}`,
  ].join('\n');
  const html = `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#1b1a18">
<h2 style="margin:0 0 16px">New message from the website</h2>
<table cellpadding="8" style="border-collapse:collapse;border:1px solid #dbd6cb;font-size:14px">
${rows.map(([l, v]) => `<tr><th align="left" valign="top" style="border:1px solid #dbd6cb;background:#efece6">${esc(l)}</th><td style="border:1px solid #dbd6cb;white-space:pre-wrap">${esc(v)}</td></tr>`).join('\n')}
</table>
<p style="color:#67635b;font-size:12px;margin-top:16px">Received ${esc(when)}${meta.ip ? ` · IP ${esc(meta.ip)}` : ''}</p>
</body></html>`;
  return { text, html };
}
