"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChoicePill } from "@/components/ui/choice";
import type { ServiceFamilyOption } from "@/lib/autolibre-api";
import { cn } from "@/lib/utils";

/**
 * Selector de rubros agrupados por familia.
 *
 * ── Se marcan RUBROS; la familia agrupa y nada mas ──────────────────────────
 *
 * Lo que sale de acá (`selected`) son slugs de rubro del catalogo, siempre.
 * La familia no viaja: es derivable —la jerarquia es estricta, cada rubro cae
 * en exactamente una— y mandarla ademas permitiria un payload contradictorio
 * ("hago la familia Motor pero ningun rubro de Motor"). El backend rechaza con
 * 400 un slug de familia aunque exista y este activo, asi que esto no es una
 * convencion nuestra: es el contrato.
 *
 * Por eso no hay ningun `useState` de familias marcadas. El estado de una
 * familia se DERIVA de sus rubros (ninguno / algunos / todos). Un segundo
 * estado paralelo seria una fuente de verdad de mas, y la primera vez que se
 * desincronice con `selected` nadie se va a enterar.
 *
 * ── Por que acordeon, y no 79 casillas a la vista ───────────────────────────
 *
 * Este formulario existe para CAPTAR talleres, y 79 checkboxes desplegados son
 * friccion que se paga en abandonos: nadie completa un alta que parece un
 * censo. Con las 16 familias plegadas, el taller sigue viendo 16 filas —lo
 * mismo que veia cuando solo se marcaban familias— y abre las dos o tres que
 * le tocan.
 *
 * O sea que la precision fina no se compra con friccion: la friccion la
 * resuelve la pantalla, no el recorte del dato. Y lo que se gana es que el
 * taller queda clasificado desde el alta, sin depender de que alguien traduzca
 * a mano al aprobar — el paso que en el legacy nunca se ejecutaba y dejaba
 * talleres aprobados pero invisibles en la app.
 *
 * ── Dos targets, no uno ─────────────────────────────────────────────────────
 *
 * La cabecera tiene el checkbox de "toda la familia" SEPARADO del boton que
 * despliega. Tentador hacer que toda la fila haga las dos cosas, pero un
 * `<input>` adentro de un `<button>` es HTML invalido y rompe el teclado: el
 * navegador no sabe cual de los dos activar con Enter.
 */
export function ServiceFamilyPicker({
  families,
  selected,
  onChange,
}: {
  readonly families: readonly ServiceFamilyOption[];
  /** Slugs de RUBRO marcados. Nunca slugs de familia. */
  readonly selected: readonly string[];
  readonly onChange: (next: string[]) => void;
}) {
  /**
   * Que familias estan desplegadas. Arranca vacio —todas plegadas— porque esa
   * es justamente la propiedad que hace que 79 rubros no asusten.
   */
  const [open, setOpen] = useState<readonly string[]>([]);

  function toggleOpen(slug: string) {
    setOpen((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  }

  function toggleService(slug: string) {
    onChange(
      selected.includes(slug)
        ? selected.filter((item) => item !== slug)
        : [...selected, slug],
    );
  }

  /**
   * "Toda la familia" es todo o nada: si ya estaban los N, los saca; si no,
   * completa los que faltan sin tocar el resto de la seleccion.
   *
   * Ojo con el caso del medio (3 de 9 marcados): ahi el click AGREGA los 6 que
   * faltan en vez de limpiar. Es lo que espera quien tildo tres y despues
   * decide que hace todo — y el camino inverso sigue disponible a un segundo
   * click.
   */
  function toggleFamily(family: ServiceFamilyOption) {
    const slugs = family.services.map((service) => service.slug);
    const allSelected = slugs.every((slug) => selected.includes(slug));

    onChange(
      allSelected
        ? selected.filter((slug) => !slugs.includes(slug))
        : [...selected, ...slugs.filter((slug) => !selected.includes(slug))],
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {families.map((family) => (
        <ServiceFamilyRow
          key={family.slug}
          family={family}
          selected={selected}
          isOpen={open.includes(family.slug)}
          onToggleOpen={() => toggleOpen(family.slug)}
          onToggleFamily={() => toggleFamily(family)}
          onToggleService={toggleService}
        />
      ))}
    </ul>
  );
}

function ServiceFamilyRow({
  family,
  selected,
  isOpen,
  onToggleOpen,
  onToggleFamily,
  onToggleService,
}: {
  readonly family: ServiceFamilyOption;
  readonly selected: readonly string[];
  readonly isOpen: boolean;
  readonly onToggleOpen: () => void;
  readonly onToggleFamily: () => void;
  readonly onToggleService: (slug: string) => void;
}) {
  const panelId = useId();
  const headingId = useId();
  const checkboxRef = useRef<HTMLInputElement>(null);

  const total = family.services.length;
  const count = family.services.filter((service) =>
    selected.includes(service.slug),
  ).length;
  const allSelected = count === total;
  const someSelected = count > 0 && !allSelected;
  /**
   * Hay familias de un solo rubro (Climatizacion y Financiacion, hoy), asi que
   * "1 rubros" no es un caso hipotetico: se ve en pantalla. Y el catalogo lo
   * define el equipo, no nosotros — cualquier familia puede quedar en uno.
   */
  const rubros = total === 1 ? "rubro" : "rubros";

  /**
   * `indeterminate` no es un atributo: solo existe como propiedad del elemento,
   * asi que React no lo puede setear via props y hay que tocarlo por ref.
   *
   * Vale la pena el ref porque es el estado que MAS informa de los tres: con
   * una familia plegada y el tilde lleno, la persona cree que marco los nueve
   * rubros cuando marco tres. La rayita dice "hay algo adentro" sin necesidad
   * de abrir.
   */
  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = someSelected;
  }, [someSelected]);

  return (
    <li
      className={cn(
        "overflow-hidden rounded-field border transition-colors",
        count > 0
          ? "border-brand/40 bg-brand/5"
          : "border-line bg-surface-subtle",
      )}
    >
      <div className="flex items-stretch">
        {/* El label envuelve al input, asi que el click ya llega solo. El texto
            accesible lo pone el `aria-label` del input: ponerlo tambien acá
            haria que el lector de pantalla lo lea dos veces. */}
        <label className="flex cursor-pointer items-center py-3 pr-2 pl-3.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-brand">
          <input
            ref={checkboxRef}
            type="checkbox"
            className="size-4 shrink-0 accent-brand"
            checked={allSelected}
            onChange={onToggleFamily}
            aria-label={`Marcar ${
              total === 1 ? "el rubro" : `los ${total} rubros`
            } de ${family.name}`}
          />
        </label>

        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex flex-1 items-center gap-2 py-3 pr-3.5 pl-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        >
          <span id={headingId} className="flex-1 text-sm font-semibold text-ink">
            {family.name}
          </span>

          {count > 0 ? (
            <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-bold text-brand">
              {count}
              <span className="sr-only">
                {" "}
                de {total} {rubros} marcados
              </span>
            </span>
          ) : (
            <span className="text-xs text-ink/45">
              {total} {rubros}
            </span>
          )}

          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={cn(
              "shrink-0 text-ink/45 transition-transform",
              isOpen && "rotate-180",
            )}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Se DESMONTA al plegar en vez de esconderse con CSS. Un checkbox
          escondido con `display:none` deja de ser tabulable, si — pero uno
          escondido con `opacity` o `height:0`, que es a lo que se suele
          recurrir para poder animar, NO. Con 16 familias eso serian 79 paradas
          de Tab invisibles antes de llegar al boton de enviar. Desmontar no
          tiene esa trampa y ademas no paga el render de 79 pildoras que nadie
          esta mirando. */}
      {isOpen ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headingId}
          className="flex flex-wrap gap-2 border-t border-line/70 px-3.5 py-3"
        >
          {family.services.map((service) => (
            <ChoicePill
              key={service.slug}
              type="checkbox"
              label={service.name}
              checked={selected.includes(service.slug)}
              onChange={() => onToggleService(service.slug)}
            />
          ))}
        </div>
      ) : null}
    </li>
  );
}
