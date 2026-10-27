import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { contactSchema, fieldErrors, formDataToObject, renderEmail } from '../../lib/contact';
import { defaultLocale, isLocale, localizePath, t } from '../../lib/i18n';

export const prerender = false;

const MIN_FILL_SECONDS = 3;

async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const json = (await res.json()) as { success?: boolean };
  return Boolean(json.success);
}

function respond(
  request: Request,
  status: number,
  payload: Record<string, unknown>,
  redirectTo: string,
) {
  if (request.headers.get('accept')?.includes('application/json')) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response(null, { status: 303, headers: { location: redirectTo } });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const formData = await request.formData().catch(() => null);
  const raw = formData ? formDataToObject(formData) : {};
  // Lingua della pagina da cui arriva il modulo: messaggi d'errore e redirect nella stessa lingua.
  const locale = isLocale(raw._lang) ? raw._lang : defaultLocale;
  const ui = t(locale).form;
  const back = (error: string) =>
    `${localizePath('/contact/', locale)}?error=${error}#contact-form`;
  const thanks = localizePath('/thanks/', locale);

  if (!formData)
    return respond(request, 400, { ok: false, message: ui.invalidRequest }, back('fields'));

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress;

  // Anti-spam: honeypot + tempo minimo di compilazione (+ Turnstile se configurato). Ai bot rispondiamo "ok".
  const startedAt = Number(raw._startedAt || 0);
  const tooFast = startedAt > 0 && Date.now() - startedAt < MIN_FILL_SECONDS * 1000;
  if (raw._website || tooFast || !(await verifyTurnstile(raw['cf-turnstile-response'], ip))) {
    return respond(request, 200, { ok: true, redirect: thanks }, thanks);
  }

  const parsed = contactSchema(locale).safeParse(raw);
  if (!parsed.success) {
    return respond(
      request,
      400,
      { ok: false, message: ui.checkFields, errors: fieldErrors(parsed.error) },
      back('fields'),
    );
  }

  const data = parsed.data;
  const { text, html } = renderEmail(data, { ip, receivedAt: new Date(), locale });
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.MAIL_TO;
  const from = process.env.MAIL_FROM || 'Website <onboarding@resend.dev>';

  if (!apiKey || !to) {
    console.warn(
      `[contact] RESEND_API_KEY o MAIL_TO mancanti: email non inviata. Contenuto:\n${text}`,
    );
    return respond(request, 200, { ok: true, redirect: thanks }, thanks);
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: data.email,
      subject: `Website message: ${data.name}`,
      text,
      html,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error('[contact] invio email fallito:', err);
    return respond(request, 502, { ok: false, message: ui.errorSend }, back('send'));
  }

  return respond(request, 200, { ok: true, redirect: thanks }, thanks);
};

export const ALL: APIRoute = () =>
  new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
