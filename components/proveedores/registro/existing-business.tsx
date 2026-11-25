"use client";

import { useEffect, useRef } from "react";
import { SuccessHead } from "@/components/proveedores/flow/flow-result";
import { Button, ButtonLink } from "@/components/ui/button";
import { ACCOUNT_PATH } from "@/lib/account/paths";
import { providersContent } from "@/lib/content/providers";

const { existing } = providersContent.flow;

type ExistingBusinessProps = {
  /** Nombres de los negocios de los que la cuenta es dueña. */
  readonly names: readonly string[];
  /** La contratación de la que vino la persona (`?next` ya validado), con su plan. */
  readonly checkout: { readonly href: string; readonly planName: string } | null;
  /** Abre el formulario para registrar un negocio más. */
  readonly onRegisterAnother: () => void;
};

/**
 * `/proveedores/registro?alta=1` con una cuenta que YA es dueña de un negocio
 * aprobado: en vez del formulario vacío (que invitaba a registrar el mismo
 * taller dos veces), se muestra el negocio y la salida a "Mi negocio". Si la
 * persona de verdad quiere sumar otro, el formulario sigue a un clic.
 *
 * El foco va al título al aparecer, como en el resto de los resultados del flujo.
 */
export function ExistingBusiness({ names, checkout, onRegisterAnother }: ExistingBusinessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    // 640px como máximo, como el resto de los resultados del flujo.
    <div className="flex max-w-160 flex-col gap-6">
      <SuccessHead headingRef={headingRef} title={existing.title} body={existing.body} />

      <section aria-labelledby="alta-negocios" className="flex flex-col gap-3 rounded-2xl bg-canvas p-5 sm:p-6">
        <h2 id="alta-negocios" className="text-sm font-semibold text-fg">
          {existing.listLabel}
        </h2>
        <ul className="flex flex-col gap-2">
          {names.map((name) => (
            <li key={name} className="font-display text-lg font-semibold text-fg">
              {name}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {checkout ? (
          // Sin prefetch: la contratación es otra pantalla privada.
          <ButtonLink href={checkout.href} prefetch={false} variant="primary" size="48">
            {existing.continueCheckout(checkout.planName)}
          </ButtonLink>
        ) : null}
        <ButtonLink href={ACCOUNT_PATH} prefetch={false} variant={checkout ? "outline" : "primary"} size="48">
          {existing.goToAccount}
        </ButtonLink>
        <Button type="button" variant="outline" size="48" onClick={onRegisterAnother}>
          {existing.registerAnother}
        </Button>
      </div>
    </div>
  );
}
