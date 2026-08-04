import { NextRequest, NextResponse } from "next/server";
import { sendAccountDeletionEmail } from "@/lib/resend";
import { EMAIL_REGEX } from "@/lib/validation";

const REASON_MAX_LENGTH = 2000;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, reason } = body;

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });
  }

  const safeReason =
    typeof reason === "string" && reason.trim()
      ? reason.trim().slice(0, REASON_MAX_LENGTH)
      : undefined;

  try {
    await sendAccountDeletionEmail({ email: email.trim(), reason: safeReason });
    return NextResponse.json({ success: true });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Error al enviar la solicitud.";
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
