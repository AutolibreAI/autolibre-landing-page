/**
 * Copy y opciones de la página de proveedores.
 *
 * IMPORTANTE: las listas de abajo son los valores exactos que se envían a
 * `/api/provider` y terminan en la Google Sheet. Cambiar un string acá
 * cambia el dato que queda guardado — no tocar sin revisar la planilla.
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

export const PROVIDER_SERVICES = [
  "Service y mantenimiento",
  "Frenos",
  "Suspensión",
  "Electricidad",
  "Chapa y pintura",
  "Diagnóstico OBD",
  "Neumáticos",
  "Inspecciones pre-compra",
  "Lavadero",
  "Detailing",
  "Baterías",
  "Tren delantero",
  "Otro",
] as const;

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
