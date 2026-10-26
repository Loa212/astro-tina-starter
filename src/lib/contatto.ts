import { z } from 'zod';

const req = (label: string) =>
  z
    .string({ error: `${label}: campo obbligatorio` })
    .trim()
    .min(1, `${label}: campo obbligatorio`);

export const contattoSchema = z.object({
  nome: req('Nome').max(120),
  email: z.email({ error: 'Indirizzo email non valido' }),
  telefono: z.string().trim().max(40).optional().default(''),
  messaggio: req('Messaggio').min(10, 'Messaggio: scrivi almeno 10 caratteri').max(5000),
  privacy: z.literal('on', { error: 'Devi accettare il trattamento dei dati' }),
});

export type Contatto = z.infer<typeof contattoSchema>;

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

export function renderEmail(data: Contatto, meta: { ip?: string; receivedAt: Date }) {
  const when = meta.receivedAt.toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
  const rows: [string, string][] = [
    ['Nome', data.nome],
    ['Email', data.email],
    ['Telefono', data.telefono || '—'],
    ['Messaggio', data.messaggio],
  ];
  const text = [
    'NUOVO MESSAGGIO DAL SITO',
    '',
    ...rows.map(([l, v]) => `${l}: ${v}`),
    '',
    `Ricevuto il ${when}${meta.ip ? ` · IP ${meta.ip}` : ''}`,
  ].join('\n');
  const html = `<!doctype html><html lang="it"><body style="font-family:Arial,sans-serif;color:#0f172a">
<h2 style="margin:0 0 16px">Nuovo messaggio dal sito</h2>
<table cellpadding="8" style="border-collapse:collapse;border:1px solid #cbd5e1;font-size:14px">
${rows.map(([l, v]) => `<tr><th align="left" valign="top" style="border:1px solid #cbd5e1;background:#f1f5f9">${esc(l)}</th><td style="border:1px solid #cbd5e1;white-space:pre-wrap">${esc(v)}</td></tr>`).join('\n')}
</table>
<p style="color:#64748b;font-size:12px;margin-top:16px">Ricevuto il ${esc(when)}${meta.ip ? ` · IP ${esc(meta.ip)}` : ''}</p>
</body></html>`;
  return { text, html };
}
