import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasActiveFilters,
  PROVEEDORES_Q_MAX_LENGTH,
  parseProveedoresFilters,
  proveedoresHref,
} from "../../lib/proveedores/query.ts";

const RUBROS = new Set(["frenos", "motor"]);
const ZONAS = new Set(["caba", "zona-norte"]);

describe("parseProveedoresFilters", () => {
  it("sin parámetros: todo vacío y primera página", () => {
    assert.deepEqual(parseProveedoresFilters({}, RUBROS, ZONAS), {
      rubro: "",
      zona: "",
      q: "",
      pagina: 1,
    });
  });

  it("lee rubro, zona, q y pagina cuando son válidos", () => {
    const filters = parseProveedoresFilters(
      { rubro: "frenos", zona: "zona-norte", q: "perez", pagina: "3" },
      RUBROS,
      ZONAS,
    );

    assert.deepEqual(filters, { rubro: "frenos", zona: "zona-norte", q: "perez", pagina: 3 });
  });

  it("un rubro o una zona desconocidos se leen como todos", () => {
    const filters = parseProveedoresFilters({ rubro: "nada", zona: "nada" }, RUBROS, ZONAS);

    assert.equal(filters.rubro, "");
    assert.equal(filters.zona, "");
  });

  it("sin lista de zonas (la faceta no cargó) la zona se ignora", () => {
    assert.equal(parseProveedoresFilters({ zona: "caba" }, RUBROS, null).zona, "");
    assert.equal(parseProveedoresFilters({ zona: "caba" }, RUBROS).zona, "");
  });

  it("q: vacío, sólo espacios o sólo saltos se lee como sin búsqueda", () => {
    for (const q of ["", " ", "   ", "\t\n"]) {
      assert.equal(parseProveedoresFilters({ q }, RUBROS, ZONAS).q, "");
    }
  });

  it("q: recorta y colapsa espacios pero conserva las tildes y las mayúsculas", () => {
    assert.equal(parseProveedoresFilters({ q: "  Mecánica   Rápida " }, RUBROS, ZONAS).q, "Mecánica Rápida");
  });

  it("q: se corta al largo máximo sin dejar un espacio al final", () => {
    const q = `${"a".repeat(PROVEEDORES_Q_MAX_LENGTH - 1)} bbbb`;
    const result = parseProveedoresFilters({ q }, RUBROS, ZONAS).q;

    assert.ok(Array.from(result).length <= PROVEEDORES_Q_MAX_LENGTH);
    assert.ok(!result.endsWith(" "));
  });

  it("q: no corta un carácter fuera del plano básico a la mitad", () => {
    const q = "😀".repeat(PROVEEDORES_Q_MAX_LENGTH + 5);
    const result = parseProveedoresFilters({ q }, RUBROS, ZONAS).q;

    assert.equal(Array.from(result).length, PROVEEDORES_Q_MAX_LENGTH);
    assert.ok(!result.includes("�"));
  });

  it("con parámetros repetidos se queda con el primero", () => {
    const filters = parseProveedoresFilters({ q: ["uno", "dos"], rubro: ["motor", "frenos"] }, RUBROS, ZONAS);

    assert.equal(filters.q, "uno");
    assert.equal(filters.rubro, "motor");
  });

  it("pagina inválida (texto, cero, negativa, decimal) es la primera", () => {
    for (const pagina of ["abc", "0", "-2", "1.5", ""]) {
      assert.equal(parseProveedoresFilters({ pagina }, RUBROS, ZONAS).pagina, 1);
    }
  });
});

describe("proveedoresHref", () => {
  it("sin filtros es /proveedores pelado", () => {
    assert.equal(proveedoresHref({}), "/proveedores");
  });

  it("no escribe pagina=1 ni parámetros vacíos", () => {
    assert.equal(proveedoresHref({ rubro: "", zona: "", q: "", pagina: 1 }), "/proveedores");
  });

  it("escribe los parámetros siempre en el mismo orden", () => {
    assert.equal(
      proveedoresHref({ pagina: 2, q: "perez", zona: "caba", rubro: "frenos" }),
      "/proveedores?rubro=frenos&zona=caba&q=perez&pagina=2",
    );
  });

  it("codifica el texto de búsqueda", () => {
    assert.equal(proveedoresHref({ q: "a&b #1 ñandú" }), "/proveedores?q=a%26b+%231+%C3%B1and%C3%BA");
  });

  it("agrega el hash al final", () => {
    assert.equal(proveedoresHref({ q: "perez" }, "red"), "/proveedores?q=perez#red");
    assert.equal(proveedoresHref({}, "red"), "/proveedores#red");
  });

  it("quitar un filtro conserva los otros", () => {
    const all = { rubro: "frenos", zona: "caba", q: "perez" };

    assert.equal(proveedoresHref({ ...all, q: "" }), "/proveedores?rubro=frenos&zona=caba");
    assert.equal(proveedoresHref({ ...all, zona: "" }), "/proveedores?rubro=frenos&q=perez");
    assert.equal(proveedoresHref({ ...all, rubro: "" }), "/proveedores?zona=caba&q=perez");
  });

  it("cambiar un filtro desde la página 3 vuelve a la primera", () => {
    const current = { rubro: "frenos", zona: "", q: "perez", pagina: 3 };

    assert.equal(proveedoresHref({ ...current, q: "lopez", pagina: 1 }), "/proveedores?rubro=frenos&q=lopez");
  });

  it("round-trip: parse(href(f)) devuelve f", () => {
    const filters = { rubro: "motor", zona: "zona-norte", q: "Mecánica & Cía", pagina: 4 };
    const url = new URL(proveedoresHref(filters), "https://autolibre.test");
    const searchParams = Object.fromEntries(url.searchParams);

    assert.deepEqual(parseProveedoresFilters(searchParams, RUBROS, ZONAS), filters);
  });
});

describe("hasActiveFilters", () => {
  it("la página sola no cuenta como filtro", () => {
    assert.equal(hasActiveFilters({ rubro: "", zona: "", q: "", pagina: 5 }), false);
  });

  it("cualquiera de los tres filtros lo activa", () => {
    assert.equal(hasActiveFilters({ rubro: "frenos", zona: "", q: "", pagina: 1 }), true);
    assert.equal(hasActiveFilters({ rubro: "", zona: "caba", q: "", pagina: 1 }), true);
    assert.equal(hasActiveFilters({ rubro: "", zona: "", q: "perez", pagina: 1 }), true);
  });
});
