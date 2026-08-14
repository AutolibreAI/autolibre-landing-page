import Image from "next/image";

/**
 * Capturas simuladas de la app que van dentro del `PhoneFrame`.
 * Son maquetas estáticas, no la app real: por eso viven acá como markup
 * y no como screenshots (pesan menos y escalan nítidas en cualquier DPI).
 */

const TABS = ["Inicio", "Garage", "IA", "Market", "Agenda"] as const;

function TabBar({ active }: { readonly active: (typeof TABS)[number] }) {
  return (
    <div className="flex justify-around border-t border-line bg-white px-1 pt-2.5 pb-1.5">
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <div
            key={tab}
            className={`flex flex-col items-center gap-[3px] ${isActive ? "opacity-100" : "opacity-45"}`}
          >
            <span
              className={`size-[18px] rounded bg-ink ${isActive ? "" : "opacity-50"}`}
            />
            <span
              className={`text-[10px] text-ink ${isActive ? "font-semibold" : ""}`}
            >
              {tab}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function VehicleCard({
  image,
  name,
  meta,
  badge,
  highlighted = false,
}: {
  readonly image: { src: string; alt: string; width: number; height: number };
  readonly name: string;
  readonly meta: string;
  readonly badge: { label: string; tone: "alert" | "ok" };
  readonly highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-3.5 ${highlighted ? "border-2 border-ink" : ""}`}
    >
      <div className="flex h-[110px] w-full items-center justify-center overflow-hidden rounded-[0.625rem] bg-white">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          /* La maqueta del teléfono nunca pasa de 320px de ancho. */
          sizes="290px"
          className="size-full object-contain"
        />
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-[17px] font-bold text-ink">{name}</p>
          <p className="mt-0.5 text-xs text-ink/50">{meta}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-[5px] text-[11px] font-semibold ${
            badge.tone === "alert"
              ? "bg-alert-bg text-alert-fg"
              : "bg-surface-muted text-brand"
          }`}
        >
          {badge.label}
        </span>
      </div>
    </div>
  );
}

/** Pantalla "Mi garage" — la que acompaña al hero. */
export function GarageScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-[4.25rem] pb-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-[26px] font-bold text-ink">
            Mi garage
          </p>
          <span className="size-[30px] rounded-full border-[1.6px] border-[#b9c2ba] opacity-60" />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-[0.625rem] bg-[#DCEFE1] px-3.5 py-2.5">
          <span className="size-[7px] shrink-0 rounded-full bg-brand" />
          <span className="text-[13px] text-ink">
            OBD2 conectado · Honda Civic
          </span>
        </div>
        <div className="mt-3 rounded-[0.625rem] bg-white px-3.5 py-3 text-sm text-ink/40">
          Buscar auto...
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 overflow-hidden px-4 pb-4">
        <VehicleCard
          highlighted
          image={{
            src: "/mockup/honda-civic.png",
            alt: "",
            width: 650,
            height: 260,
          }}
          name="Honda Civic"
          meta="AB123CD · OBD2 · Hoy"
          badge={{ label: "2 alertas", tone: "alert" }}
        />
        <VehicleCard
          image={{
            src: "/mockup/toyota-etios.png",
            alt: "",
            width: 794,
            height: 400,
          }}
          name="Toyota Etios"
          meta="AC456EF · Escaneo: hace 5 días"
          badge={{ label: "OK", tone: "ok" }}
        />
      </div>

      <span className="absolute right-4 bottom-[5.25rem] flex size-[46px] items-center justify-center rounded-full bg-ink text-[22px] text-white shadow-[0_6px_16px_rgba(0,0,0,0.2)]">
        +
      </span>

      <TabBar active="Garage" />
    </div>
  );
}

/** Pantalla "Chat IA" — la que acompaña la sección de diagnóstico. */
export function ChatScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-[4.25rem] pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-[18px] w-[22px] rounded-t-md rounded-br-md bg-ink" />
            <p className="font-display text-[22px] font-bold text-ink">
              Chat IA
            </p>
          </div>
          <span className="size-[26px] rounded-full border-[1.6px] border-[#b9c2ba] opacity-60" />
        </div>
        <div className="mt-3.5 flex w-fit gap-1 rounded-[0.625rem] bg-[#DDE7E0] p-1">
          <span className="rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-ink">
            Diagnóstico
          </span>
          <span className="px-4 py-2 text-[13px] font-semibold text-ink/45">
            General
          </span>
        </div>
        <p className="mt-4 text-[13px] text-ink/75">
          🚗 Diagnosticando: Honda Civic
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 py-2.5">
        <p className="max-w-[78%] self-end rounded-[14px] rounded-br-[4px] bg-ink px-4 py-3 text-sm leading-relaxed text-white">
          Me hace ruido cuando freno
        </p>
        <p className="max-w-[88%] self-start rounded-[14px] rounded-tl-[4px] bg-white px-4 py-3.5 text-sm leading-relaxed text-ink">
          Por lo que describís, probablemente sean las pastillas de freno
          gastándose. No es urgente todavía, pero conviene revisarlas pronto.
        </p>
        <div className="rounded-[14px] bg-white p-4">
          <span className="mb-2.5 inline-block rounded-full bg-[#EEF1EE] px-3 py-[5px] text-[11px] font-semibold text-ink">
            ✦ Recomendación
          </span>
          <p className="mb-1.5 font-display text-[15px] font-bold text-ink">
            Revisar pastillas de freno
          </p>
          <p className="text-[13px] leading-relaxed text-ink/65">
            Según el ruido que describís, es probable que estén por debajo del
            20% de vida útil.
          </p>
        </div>
        <span className="w-fit rounded-[0.625rem] bg-ink px-5 py-3 text-sm font-semibold text-white">
          Agregar a tareas
        </span>
      </div>

      <div className="bg-[#EEF1EE] px-4 py-2.5">
        <div className="flex items-center justify-between rounded-3xl bg-white py-3 pr-3 pl-4.5">
          <span className="text-[13px] text-ink/40">Escribí tu mensaje...</span>
          <span className="size-[30px] shrink-0 rounded-full bg-[#DDE7E0]" />
        </div>
      </div>

      <TabBar active="IA" />
    </div>
  );
}
