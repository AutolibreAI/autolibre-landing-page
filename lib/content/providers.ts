/**
 * Copy y opciones de la página de proveedores.
 *
 * IMPORTANTE: las listas de abajo son los valores exactos que se envían a
 * `/api/provider` y quedan guardados en `partner_applications`. Cambiar un
 * string acá cambia el dato persistido — no tocar sin mirar qué hay cargado.
 *
 * Los servicios son la excepción y ya no viven acá: los define el catálogo del
 * backend. Ver el comentario más abajo, donde estaban.
 */
export const providersContent = {
  hero: {
    titleLines: [
      "Las consultas llegan con nuestro análisis previo",
      "y la información del auto.",
    ],
    subtitle:
      "Antes de que te llegue, preguntamos lo necesario para entender el problema. Recibís la consulta con la información (marca, el modelo, año) y un pre-diagnóstico. Sin pérdida de tiempo por WhatsApp para saber qué necesita.",
  },

  reasons: [
    {
      id: "reason-consultas",
      title: "Consultas acotadas",
      description:
        "Marca, modelo, año y el problema ya delimitado. En algunos casos, con los datos de la ECU del auto.",
    },
    {
      id: "reason-zona",
      title: "De tu zona y de tu especialidad",
      description:
        "Recibís lo que corresponde a tu rubro y tu área. Contestás los que te sirven.",
    },
    {
      id: "reason-perfil",
      title: "Tu perfil en la app",
      description:
        "Los usuarios te ven con tu logo, tus horarios, tus especialidades y cómo contactarte.",
    },
  ],

  form: {
    title: "Sumate como proveedor",
    subtitle: "Te contactamos para activar tu perfil.",
    submitLabel: "Quiero registrar mi taller",
    submitLoadingLabel: "Enviando...",
    note: "Te contactamos para activar tu perfil.",
  },
} as const;

export const PROVIDER_BRANDS = [
  "Audi",
  "BAIC",
  "BMW",
  "Chery",
  "Chevrolet",
  "Citroën",
  "Coradir",
  "DFSK",
  "DS Automobiles",
  "Fiat",
  "Ford",
  "Foton",
  "Great Wall",
  "Haval",
  "Honda",
  "Hyundai",
  "Iveco",
  "JAC",
  "Jeep",
  "Kia",
  "Mercedes-Benz",
  "Nissan",
  "Peugeot",
  "Renault",
  "Scania",
  "Sero Electric",
  "Toyota",
  "Volvo",
  "Volkswagen",
  "Volt Motors",
] as const;

/**
 * Los servicios NO se listan acá.
 *
 * Vivian en dos constantes hardcodeadas (`PROVIDER_SERVICES` y la anterior
 * `PROVIDER_SERVICES_DEP`) que no coincidian ni entre si ni con el catalogo del
 * backend: tres vocabularios distintos para la misma cosa. Hoy las opciones
 * salen de `GET /api/v1/service-catalog` (ver `fetchServiceCatalog` en
 * `lib/autolibre-api.ts`), que es la fuente de verdad, y lo que se envia es el
 * slug de cada rubro.
 *
 * Si aparece la tentacion de volver a poner una lista de servicios acá: el
 * rubro se da de alta en el catalogo del backend, no en este archivo.
 */

export const PROVIDER_VEHICLE_TYPES = [
  "Autos",
  "SUVs",
  "Pickups",
  "Motos",
] as const;

export const PROVIDER_FUEL_TYPES = [
  "Nafta",
  "Diesel",
  "Híbridos",
  "Eléctricos",
] as const;

export const PROVIDER_HOW_FOUND = [
  "Google",
  "WhatsApp",
  "Un cliente nos contactó",
  "Redes sociales",
  "Amigo / conocido",
  "Otro",
] as const;

/** Opción que dispara el campo de texto libre en servicios y en "cómo nos conociste". */
export const OTHER_OPTION = "Otro";
