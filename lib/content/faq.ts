import type { FaqCategory, FaqItem } from "@/lib/content/types";

/**
 * FAQ agrupada por categoría. Alimenta dos cosas a la vez: la UI con tabs
 * y el schema `FAQPage`. Una sola fuente = imposible que el structured data
 * se desincronice de lo que ve el usuario.
 *
 * Combina las preguntas del diseño nuevo con las de la landing anterior
 * (que traían el contenido largo de OBD-II, escáneres y compatibilidad).
 * El adaptador se llevó a su propia categoría: si no, "Diagnóstico"
 * quedaba con 13 preguntas y las tabs dejaban de servir para navegar.
 */
export const faqCategories: readonly FaqCategory[] = [
  {
    id: "empezar",
    name: "Empezar",
    items: [
      {
        id: "faq-que-es",
        question: "¿Qué es AutoLibre?",
        answer:
          "AutoLibre es el asistente inteligente que entiende lo que le pasa a tu auto. Podés describir cualquier síntoma —un ruido raro, una luz en el tablero, algo que no se siente bien— y la IA te explica qué puede estar pasando y si necesitás ir a un taller. Si además conectás un escáner OBD-II, accede directamente a los datos del vehículo para un diagnóstico aún más preciso. También te ayuda a gestionar todos tus trámites obligatorios —VTV, seguro, patente y servicios— para que nunca más tengas que adivinar cuándo actuar.",
      },
      {
        id: "faq-como-empiezo",
        question: "¿Cómo empiezo?",
        answer:
          "Dejanos tu nombre y tu mail y te avisamos cuando te toque. Al entrar, ponés la patente y tu auto queda cargado con todos sus datos.",
      },
      {
        id: "faq-cuando-usar",
        question: "¿Cuándo puedo empezar a usarla?",
        answer:
          "Estamos abriendo el acceso de a poco. Dejanos tu mail y te escribimos cuando sea tu turno. Funciona en iPhone y en Android.",
      },
      {
        id: "faq-costo",
        question: "¿Tiene costo usar la app?",
        answer:
          "No, usar AutoLibre para guardar documentación, vencimientos e historial es gratis. El adaptador de diagnóstico es opcional y tiene un costo aparte.",
      },
      {
        id: "faq-varios-autos",
        question: "¿Puedo cargar más de un auto?",
        answer:
          "Sí, podés sumar todos los autos que quieras a la misma cuenta, sean tuyos o de tu familia.",
      },
      {
        id: "faq-tipo-usuario",
        question: "¿Para qué tipo de usuario está pensado?",
        answer:
          "Para dos perfiles principales: el dueño de un auto que alguna vez no supo qué le pasaba, cuanto salía o donde llevarlo, y quién gestiona una pequeña flota familiar o empresarial y necesita mantener el control de vencimientos y estado de varios vehículos.",
      },
      {
        id: "faq-soporte",
        question: "¿Tienen soporte si tengo un problema?",
        answer:
          "Sí. Podés contactar a contact@autolibre.ai para cualquier consulta.",
      },
    ],
  },
  {
    id: "diagnostico",
    name: "Diagnóstico",
    items: [
      {
        id: "faq-diagnostica-sola",
        question: "¿La app diagnostica fallas por mi cuenta?",
        answer:
          "No. La IA te orienta sobre qué puede estar pasando según lo que le contás, pero el diagnóstico final siempre lo confirma un mecánico.",
      },
      {
        id: "faq-adaptador-obligatorio",
        question: "¿Necesito el adaptador para usar el diagnóstico?",
        answer:
          "No es obligatorio. Podés contarle los síntomas igual. El adaptador suma la lectura del motor para un panorama más completo.",
      },
      {
        id: "faq-diferencia",
        question: "¿Por qué es diferente a otras apps de diagnóstico?",
        answer:
          "AutoLibre va varios pasos más: diagnóstico por síntomas (sin necesitar ningún dispositivo), diagnóstico por OBD-II con explicación en lenguaje claro, y gestión de trámites centralizada con recordatorios automáticos.",
      },
      {
        id: "faq-tipo-fallas",
        question: "¿Qué tipo de fallas puede detectar?",
        answer:
          "Detecta fallas basadas en códigos de error OBD-II (DTC), desde problemas de emisiones y sensores hasta fallos del motor. Cada código se traduce a lenguaje claro con una indicación de urgencia.",
      },
      {
        id: "faq-reparaciones-costosas",
        question: "¿La IA puede ayudarme a evitar reparaciones costosas?",
        answer:
          "Sí. AutoLibre está orientado al mantenimiento preventivo: la IA analiza los datos del vehículo y alerta ante señales tempranas de falla. Detectar un problema a tiempo suele costar diez veces menos que repararlo tarde.",
      },
      {
        id: "faq-sin-senal",
        question: "¿La app funciona sin señal en la ruta?",
        answer:
          "Sí. La conexión entre el escáner y el celular es por Bluetooth y no requiere internet. Los datos se ven en tiempo real aunque no haya señal. Las funciones de IA y los reportes se sincronizan automáticamente al recuperar conexión.",
      },
    ],
  },
  {
    id: "adaptador",
    name: "Adaptador OBD2",
    items: [
      {
        id: "faq-que-es-obd",
        question: "¿Qué es el puerto OBD-II?",
        answer:
          "Es una conexión estándar que todos los autos fabricados desde 1996 tienen por ley. Fue creada principalmente por razones ambientales, para estandarizar el diagnóstico de fallas y garantizar que los vehículos cumplieran con las normativas de emisiones contaminantes a largo plazo. AutoLibre te da esa información en lenguaje claro, para que por primera vez seas vos quien toma las decisiones sobre tu vehículo.",
      },
      {
        id: "faq-que-adaptador",
        question: "¿Qué adaptador necesito y dónde lo consigo?",
        answer:
          "Un adaptador OBD2 con bluetooth, desde $10.000. Cuando entres, te llevamos directo a dónde comprarlo.",
      },
      {
        id: "faq-que-escaner",
        question: "¿Qué escáner recomiendan usar?",
        answer:
          'La recomendación principal es el Vgate iCar Pro: bajo consumo de batería, compatibilidad garantizada y estabilidad de conexión probada. También son compatibles el Konnwei KW906 y el ELM327 v1.5. Atención con el ELM327: existen versiones que no son compatibles con iPhone. Aseguráte de que diga "BLE" o "Bluetooth 4.0" en la descripción antes de comprarlo.',
      },
      {
        id: "faq-autos-compatibles",
        question: "¿Qué autos son compatibles con el adaptador?",
        answer:
          "La mayoría de los autos con conector de diagnóstico bajo el volante. Decinos marca, modelo y año y te confirmamos si el tuyo funciona.",
      },
      {
        id: "faq-cualquier-auto",
        question: "¿Funciona con cualquier auto?",
        answer:
          "La app funciona con cualquier auto. El diagnóstico por OBD-II requiere un escáner y un auto de 1996 o más nuevo — que es la gran mayoría. ¿Tenés dudas sobre tu modelo? Preguntale al chat.",
      },
      {
        id: "faq-como-conecta",
        question: "¿Cómo se conecta la app con mi auto?",
        answer:
          "Se utiliza un pequeño dispositivo llamado escáner OBD-II que se enchufa en el puerto de diagnóstico del vehículo (generalmente debajo del volante). La app se comunica con él de forma inalámbrica por Bluetooth.",
      },
      {
        id: "faq-ios-android",
        question: "¿Es compatible con iPhone y Android?",
        answer:
          "Sí. Gracias al uso de Bluetooth Low Energy (BLE), se garantiza conexión estable en iOS y Android. Si se usa ELM327, verificar que la versión sea BLE-compatible antes de usarlo con iPhone.",
      },
    ],
  },
  {
    id: "talleres",
    name: "Talleres y servicios",
    items: [
      {
        id: "faq-pedir-servicio",
        question: "¿Cómo pido un servicio?",
        answer:
          "Contás qué necesitás desde la app y talleres cerca tuyo te responden, ya con los datos de tu auto cargados.",
      },
      {
        id: "faq-zonas",
        question: "¿En qué zonas hay talleres disponibles?",
        answer:
          "Hoy operamos en AMBA y estamos ampliando a otras zonas del país.",
      },
      {
        id: "faq-elegir-taller",
        question: "¿Puedo elegir con qué taller trabajar?",
        answer:
          "Sí, vos elegís entre las respuestas que recibís. Nada se confirma sin que lo decidas.",
      },
    ],
  },
  {
    id: "historial",
    name: "Historial y documentación",
    items: [
      {
        id: "faq-documentos",
        question: "¿Qué documentos puedo guardar?",
        answer:
          "Cédula, título, póliza de seguro, licencia de conducir y cualquier comprobante de service o reparación.",
      },
      {
        id: "faq-servicios-previos",
        question: "¿Qué pasa con los servicios que hice antes de usar la app?",
        answer:
          "Los podés cargar vos mismo con fecha, taller y comprobante, para tener el historial completo.",
      },
      {
        id: "faq-tramites",
        question: "¿Qué trámites puedo gestionar desde la app?",
        answer:
          "Podés configurar recordatorios automáticos para el vencimiento de la VTV/RTO, la renovación del seguro, el pago de patentes y los servicios de mantenimiento programado. Todo en un solo lugar.",
      },
      {
        id: "faq-vender-auto",
        question: "¿El historial sirve para vender el auto?",
        answer:
          "Sí, un historial ordenado con comprobantes es un respaldo fuerte a la hora de vender.",
      },
      {
        id: "faq-comprar-vender-usado",
        question: "¿Puedo usar AutoLibre para comprar o vender un auto usado?",
        answer:
          "Sí, y es una de las funciones más esperadas —próxima a lanzarse. Si estás comprando, AutoLibre detecta fallas ocultas e identifica si se borraron errores recientemente. Si estás vendiendo, podés generar un certificado de inspección para mostrarle al comprador.",
      },
    ],
  },
];

/** Todas las preguntas aplanadas — lo que consume el schema `FAQPage`. */
export const allFaqItems: readonly FaqItem[] = faqCategories.flatMap(
  (category) => category.items,
);
