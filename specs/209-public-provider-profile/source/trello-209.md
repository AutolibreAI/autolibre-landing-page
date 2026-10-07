# Fuente: tarjeta de Trello #209

- **URL**: https://trello.com/c/YPh3RArn/209-perfil-p%C3%BAblico-de-proveedor-web-app-spec-y-dise%C3%B1o
- **Copiada textualmente**: 2026-10-07, pegada por el equipo en la conversación. El agente no puede leer Trello (la página exige sesión), así que **este archivo es la fuente**: si la tarjeta cambia, hay que actualizarlo a mano.
- **Diseño vinculado** (borrador, datos ficticios): https://claude.ai/artifact/6fWW6HgWw1rCXE9zxzFteU — canvas con 4 piezas: Web (1280px), App (390px), App · proveedor sin local y Vista previa al compartir (1200×630).

---

Perfil público de proveedor (web + app) — spec para devs
Diseño (borrador): [Perfil de proveedor — AutoLibre](https://claude.ai/artifact/6fWW6HgWw1rCXE9zxzFteU)
Canvas con 4 piezas: Web, App, App sin local y Vista previa al compartir. Los datos del diseño son ficticios ("Mecánica Barrancas", "Gestoría Norte"); fotos y logos son marcadores.
Objetivo
Una página por proveedor que sea tan buena que el proveedor la use como su propia web: que la mande a clientes, la ponga como sitio web en su perfil de Google Maps y que Google y los LLMs la indexen. La misma información se ve en la app.
Tres lectores: el cliente final (decide rápido si confía), el proveedor (la comparte) y Google/LLMs (datos estructurados + texto claro + URL estable). Tiene que servir para cualquier rubro (mecánica, gomería, lavadero, gestoría), no solo para talleres.

URL y render

* URL pública estable: `autolibre.ai/proveedor/<slug>` (ej. `autolibre.ai/proveedor/mecanica-barrancas-san-isidro`). Slug = nombre + localidad. Si cambia el nombre, redirect 301 del slug viejo.
* Renderizado del lado del servidor (SSR/SSG). El contenido tiene que estar en el HTML inicial; si se arma en el cliente, Google y los LLMs ven poco o nada.
* Link corto opcional vía el Worker de Cloudflare.
* La app muestra la misma info en una pantalla nativa (o webview), con dos agregados propios de la app (ver abajo).

Bloques, en orden
1. Encabezado (identidad + acción)

* Foto de portada (idealmente la fachada).
* Logo (cuadrado, se superpone a la portada).
* Nombre comercial (`h1`).
* Sello "Aliado de AutoLibre" (es el único sello que existe hoy; lleva el isotipo).
* Rubro principal + rubros secundarios (pills). En app: principal + "+N rubros".
* Puntuación promedio + cantidad de reseñas (link a la sección de reseñas).
* Estado en vivo: "Abierto · cierra 18:00" / "Cerrado · abre mañana 8:00". Se calcula desde los horarios en `America/Argentina/Buenos_Aires`.
* Zona: localidad (web). En app: localidad + distancia si hay permiso de ubicación.
* Botones: WhatsApp (principal), Llamar, Cómo llegar, Compartir. En web, "Pedir propuesta" vive en una card de la columna derecha; en app es un botón más.
* Solo app, con sesión: botón "Hacerlo mi taller de cabecera" (conecta con la función de taller de cabecera).

2. Sobre el proveedor

* Descripción (texto libre del proveedor).
* Quién atiende: nombre + rol + foto (opcional).
* Años en el rubro.
* "En AutoLibre desde <mes año>" (dato nuestro).

3. Servicios y especialidades

* Servicios agrupados por categoría (pills). Sin precio ni duración.
* Marcas que atiende.
* Tipos de vehículo (autos, camionetas, motos, con GNC, etc.).
* Equipamiento relevante (texto/pills). No nombrar modelos de escáner.
* Estos datos tienen que ser estructurados (no texto libre): alimentan el matcheo de pedidos y las preguntas frecuentes.

4. Trabajos hechos

* Cards con: foto(s) antes/después, servicio, vehículo (marca, modelo, año), fecha (mes y año).
* Dos orígenes, con badge distinto:
   * "Registrado en AutoLibre": salió de un pedido real / historial clínico.
   * "Cargado por el taller": portfolio propio.
* Contador: "N registrados en AutoLibre · M en total".
* Web: grilla, 3 visibles + "Ver los M trabajos". App: carrusel horizontal.

5. Reseñas

* Solo reseñas de AutoLibre (no se importan ni se muestran reseñas de Google).
* Puntuación general sin desglose por dimensión.
* Cada reseña: nombre + inicial del apellido, vehículo, fecha, estrellas, texto, respuesta pública del proveedor (opcional).
* Web: 3 visibles; app: 2. Link "Ver las N reseñas".

6. Medido por AutoLibre (métricas)

* Tiempo de respuesta promedio, tasa de pedidos respondidos, propuestas enviadas.
* Cada métrica se muestra solo si supera un umbral (regla determinística, sin LLM). Si ninguna lo supera, el bloque no aparece. Umbrales: a definir.
* Bajada fija: "Solo se muestran los datos que superan nuestro estándar."

7. Horarios

* Horario semanal; el día de hoy resaltado.
* Excepciones/feriados: por ahora texto fijo "Feriados: consultar por WhatsApp".

8. Ubicación

* Con local: mapa con pin + dirección completa + "Cómo llegar".
* Sin local (gestoría, servicios a domicilio): en el encabezado, en vez de dirección: "A domicilio y online · <zona>". Se saca "Cómo llegar". El bloque pasa a "Zona de cobertura": mapa con área + lista de partidos/localidades + texto "No atiende en un local a la calle. Coordiná por WhatsApp dónde y cuándo." (Propuesta en el artboard "App · proveedor sin local".)

9. Preguntas frecuentes

* Se generan desde los datos estructurados con plantillas (sin que el proveedor escriba nada). Ej.: "¿Atienden autos Peugeot?" (marcas), "¿Abren los sábados?" (horarios), "¿Hacen diagnóstico con escáner?" (servicios/equipamiento), "¿Trabajan con autos con GNC?" (vehículos).
* Lógica determinística; un LLM puede redactar la respuesta, nunca decidir el contenido.
* Acordeón (`<details>/<summary>` en web).

10. Contacto, redes y pie

* Teléfono, Instagram y web propia del proveedor (si la tiene).
* Web: banda de AutoLibre al pie (logo blanco, "Descargá AutoLibre", "Sumá tu negocio") + URL del perfil.
* App: URL del perfil + botón "Compartir perfil".

Fuera de alcance por ahora

* Condiciones (medios de pago, factura, garantía, turno, retiro y entrega): no están relevadas.
* Precios y duración de servicios.
* Desglose de la puntuación.
* Reseñas externas (Google).
* "Reclamar perfil": los proveedores se registran solos, AutoLibre no carga perfiles.
* Otros sellos además de "Aliado".
* Diferencias entre perfil gratis y pago: no definido todavía.

SEO / AEO (crítico)

* `<title>`: "<Nombre> — <rubro principal> en <localidad> | AutoLibre". Meta description desde la descripción (recortada).
* `<link rel="canonical">` a la URL del slug.
* JSON-LD [schema.org](http://schema.org) con el tipo según rubro: `AutoRepair`, `TireShop`, `AutoWash`, `AutoBodyShop`, `AutoPartsStore` o `AutomotiveBusiness` como genérico. Campos: `name`, `logo`, `image`, `description`, `telephone`, `url`, `address` + `geo` (con local) o `areaServed` (sin local), `openingHoursSpecification`, `aggregateRating`, `review`, `sameAs` (redes).
* `FAQPage` en JSON-LD con las preguntas frecuentes.
* `BreadcrumbList`: Proveedores › <Localidad> › <Rubro> › <Nombre> (también visible en la web).
* Agregar los perfiles al `sitemap.xml`.
* Que la página tenga el contenido como texto real (no en imágenes).
* Instrucción para el proveedor: poner esta URL como "Sitio web" en su Perfil de Empresa de Google. Además de ordenarle la presencia, le da a [autolibre.ai](http://autolibre.ai) un link entrante por cada proveedor.

Vista previa al compartir (Open Graph)

* `og:title`, `og:description`, `og:image`, `og:url` + `twitter:card=summary_large_image`.
* `og:image` 1200×630 generada dinámicamente por proveedor: logo, nombre, rubro + localidad, puntuación y reseñas, sello Aliado, logo de AutoLibre y foto de portada a la derecha (ver artboard "Vista previa al compartir"). Es clave porque el link se va a compartir sobre todo por WhatsApp.

Diseño

* Design System "AutoLibre AI": canvas `#F1F2F0`, cards `#FEFEFD` con borde 1px `#E4EAE4`, sin sombras. CTA principal `action-dark #1C2B1C` con texto blanco. Verde de marca `#2A8C3A` solo como acento. Estado OK `status-green`.
* Tipografía: Outfit (títulos y datos), DM Sans (cuerpo).
* Radios: 8 botones, 12 icon-wrap, 16 cards, 20 pills. Íconos Phosphor.
* Logo de AutoLibre siempre como imagen (nunca texto).
* Web responsive: dos columnas en desktop; en mobile la columna derecha pasa debajo.

Datos a pedir / modelo (resumen)
Del proveedor: nombre, logo, portada, rubro principal y secundarios, descripción, quién atiende (nombre, rol, foto), año de inicio, servicios por categoría, marcas, tipos de vehículo, equipamiento, trabajos (fotos, servicio, vehículo, fecha), dirección + coordenadas o zona de cobertura, horarios, teléfono, WhatsApp, redes, web propia.
De AutoLibre: sello Aliado, fecha de alta, reseñas y respuestas, trabajos registrados vía pedidos, métricas (tiempo de respuesta, tasa de respuesta, propuestas enviadas), slug.
Sugerencia: completar el perfil de a poco (indicador tipo "perfil completo al 70%") sin alargar el alta de 2 minutos.

Decisiones abiertas

* Valores de los umbrales de las métricas.
* Qué entra en el perfil gratis y qué en la suscripción.
* Validar con proveedores reales la variante sin local.
