"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { clearRoleHint } from "@/lib/auth/role-hint";
import { accountContent } from "@/lib/content/account";

const { signOutConfirm } = accountContent;

type SignOutConfirmProps = {
  /** `/cuenta` sin `?salir`: adónde va "No, seguir en mi cuenta". */
  readonly selfPath: string;
};

/**
 * `/cuenta?salir=1` con sesión: el "Cerrar sesión" del menú del header
 * público (que no carga Clerk) llega acá. ANTES cerraba la sesión apenas se
 * abría el link: cualquiera podía mandarlo y desloguearte con un GET. Ahora
 * es una confirmación: la sesión se cierra recién con el botón, que es un
 * POST de Clerk disparado por un click de la persona. Abrir el link solo
 * muestra esta pantalla.
 *
 * Al confirmar: borra la pista de rol del header (`al_role`) y cierra la
 * sesión, de vuelta al inicio. El foco va al título al montar, para que el
 * lector de pantalla anuncie la pregunta.
 */
export function SignOutConfirm({ selfPath }: SignOutConfirmProps) {
  const { signOut } = useClerk();
  const [leaving, setLeaving] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  async function confirm() {
    setLeaving(true);
    clearRoleHint();
    await signOut({ redirectUrl: "/" });
  }

  return (
    <div className="mx-auto flex max-w-130 flex-col gap-6 rounded-panel border border-card-line bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <h1
          id={PRIVATE_FLOW_TITLE_ID}
          ref={titleRef}
          tabIndex={-1}
          className="font-display text-2xl font-bold text-fg md:text-3xl"
        >
          {signOutConfirm.title}
        </h1>
        <p className="leading-relaxed text-fg-muted">{signOutConfirm.body}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row" aria-live="polite">
        <Button
          type="button"
          variant="primary"
          size="48"
          aria-disabled={leaving}
          onClick={() => {
            if (!leaving) void confirm();
          }}
        >
          {leaving ? signOutConfirm.leaving : signOutConfirm.confirm}
        </Button>
        <ButtonLink href={selfPath} variant="outline" size="48" prefetch={false}>
          {signOutConfirm.cancel}
        </ButtonLink>
      </div>
    </div>
  );
}
