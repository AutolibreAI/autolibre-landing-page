import { Resend } from "resend";

export interface SupportTicket {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly subject: string;
  readonly message: string;
}

/**
 * Sandbox de Resend: sin dominio verificado solo puede mandar al email con el
 * que se creo la cuenta (debe coincidir con SUPPORT_EMAIL_TO). reply_to queda
 * en el email del usuario (si lo dejo) para poder responderle directo desde
 * el inbox; si solo dejo telefono, va en el cuerpo del mensaje.
 */
export async function sendSupportEmail(ticket: SupportTicket): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_EMAIL_TO;
  if (!apiKey || !to) {
    throw new Error("Faltan RESEND_API_KEY / SUPPORT_EMAIL_TO.");
  }
  if (!ticket.email && !ticket.phone) {
    throw new Error("Falta un dato de contacto (email o telefono).");
  }

  const contactLines = [
    ticket.email ? `Email: ${ticket.email}` : null,
    ticket.phone ? `Teléfono: ${ticket.phone}` : null,
  ].filter((line): line is string => line !== null);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "AutoLibre Soporte <onboarding@resend.dev>",
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
 * mismo remitente/destino sandbox de Resend que sendSupportEmail (ver arriba).
 */
export async function sendAccountDeletionEmail(request: AccountDeletionRequest): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_EMAIL_TO;
  if (!apiKey || !to) {
    throw new Error("Faltan RESEND_API_KEY / SUPPORT_EMAIL_TO.");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "AutoLibre Soporte <onboarding@resend.dev>",
    to,
    replyTo: request.email,
    subject: `[Eliminar cuenta] Solicitud de eliminación — ${request.email}`,
    text: `Cuenta a eliminar: ${request.email}\n\nMotivo:\n${request.reason || "(sin especificar)"}`,
  });

  if (error) throw new Error(error.message);
}
