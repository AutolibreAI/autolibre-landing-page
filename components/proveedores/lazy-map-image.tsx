"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type LazyMapImageProps = {
  readonly src: string;
  /** Medidas de la imagen pedida (px CSS, antes del `scale=2`). */
  readonly width: number;
  readonly height: number;
};

/** Primera interacción de la persona: después de esto el LCP ya no se mide. */
const INTERACTION_EVENTS = ["scroll", "pointerdown", "keydown", "touchstart", "wheel"] as const;

/**
 * Imagen de Static Maps que se pide recién cuando el mapa está en pantalla
 * (`IntersectionObserver`) Y la persona ya interactuó con la página.
 *
 * ¿Por qué esperar la interacción? El navegador deja de medir el LCP con la
 * primera interacción (scroll, toque o tecla). En la línea base el mapa del
 * perfil fue el LCP de escritorio (`lcp-lazy-loaded`): es la imagen más
 * grande que entra en el primer viewport. Pidiéndola después de interactuar,
 * nunca compite con el `<h1>`. Para llegar a un mapa que está más abajo hay
 * que scrollear, así que en la práctica solo cambia algo cuando el mapa ya
 * está a la vista al cargar: ahí se ve el fondo de referencia (con los
 * marcadores) hasta el primer gesto.
 *
 * Va `absolute inset-0` sobre un contenedor de medidas fijas que dibuja el
 * server: aparecer no mueve nada (CLS 0). Si Google rechaza la key (por
 * ejemplo, por referer), la imagen se saca y queda el fondo.
 */
export function LazyMapImage({ src, width, height }: LazyMapImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"waiting" | "load" | "failed">("waiting");

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    let visible = false;
    let interacted = false;

    const cleanup = () => {
      observer.disconnect();
      for (const name of INTERACTION_EVENTS) window.removeEventListener(name, onInteract);
    };
    const tryLoad = () => {
      if (!visible || !interacted) return;
      cleanup();
      setState("load");
    };
    function onInteract() {
      interacted = true;
      tryLoad();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        tryLoad();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(element);
    for (const name of INTERACTION_EVENTS) {
      window.addEventListener(name, onInteract, { passive: true });
    }
    return cleanup;
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0">
      {state === "load" ? (
        // `unoptimized`: la URL de Static Maps lleva la key pública y Google
        // puede restringirla por referer: la pide el navegador, no el
        // optimizador del server. `alt=""`: decorativa, el contenido del mapa
        // (nombres y direcciones) ya está en el HTML.
        <Image
          src={src}
          alt=""
          width={width}
          height={height}
          unoptimized
          onError={() => setState("failed")}
          className="size-full object-cover"
        />
      ) : null}
    </div>
  );
}
