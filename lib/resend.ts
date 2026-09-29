import { Resend } from "resend";

export interface SupportTicket {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly subject: string;
  readonly message: string;
}

/**
 * El remitente sale de SUPPORT_EMAIL_FROM y tiene que pertenecer a un dominio
 * verificado en Resend (support.autolibre.ai); con el sandbox
 * (onboarding@resend.dev) solo se puede mandar al email dueño de la cuenta.
 */
function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SUPPORT_EMAIL_FROM;
  const to = process.env.SUPPORT_EMAIL_TO;
  if (!apiKey || !from || !to) {
    throw new Error("Faltan RESEND_API_KEY / SUPPORT_EMAIL_FROM / SUPPORT_EMAIL_TO.");
  }
  return { resend: new Resend(apiKey), from, to };
}

/**
 * reply_to queda en el email del usuario (si lo dejo) para poder responderle
 * directo desde el inbox; si solo dejo telefono, va en el cuerpo del mensaje.
 */
export async function sendSupportEmail(ticket: SupportTicket): Promise<void> {
  const { resend, from, to } = getEmailConfig();
  if (!ticket.email && !ticket.phone) {
    throw new Error("Falta un dato de contacto (email o telefono).");
  }

  const contactLines = [
    ticket.email ? `Email: ${ticket.email}` : null,
    ticket.phone ? `Teléfono: ${ticket.phone}` : null,
  ].filter((line): line is string => line !== null);

  const { error } = await resend.emails.send({
    from,
    to,
    ...(ticket.email ? { replyTo: ticket.email } : {}),
    subject: `[Soporte AutoLibre] ${ticket.subject} — ${ticket.name}`,
    text: `De: ${ticket.name}\n${contactLines.join("\n")}\n\n${ticket.message}`,
  });

  if (error) throw new Error(error.message);
}

export interface AccountDeletionRequest {
  readonly email: string;
  readonly reason?: string;
}

/**
 * No hay endpoint de backend para esto: la baja de cuenta la completa un
 * humano del equipo a mano. Este email es la única notificación — reusa el
 * mismo remitente/destino que sendSupportEmail (ver getEmailConfig).
 */
export async function sendAccountDeletionEmail(request: AccountDeletionRequest): Promise<void> {
  const { resend, from, to } = getEmailConfig();
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: request.email,
    subject: `[Eliminar cuenta] Solicitud de eliminación — ${request.email}`,
    text: `Cuenta a eliminar: ${request.email}\n\nMotivo:\n${request.reason || "(sin especificar)"}`,
  });

  if (error) throw new Error(error.message);
}
