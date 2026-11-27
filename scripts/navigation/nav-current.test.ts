import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { navCurrent, navCurrentPage } from "../../lib/navigation/nav-current.ts";

// `aria-current` de los links de sección del header: `"page"` en la página
// del link, `"true"` en las páginas que viven dentro de esa sección.

describe("navCurrent", () => {
  it("marca `page` cuando el link apunta a la página actual", () => {
    assert.equal(navCurrent("/proveedores", "/proveedores"), "page");
    assert.equal(navCurrent("/blog", "/blog"), "page");
    assert.equal(navCurrent("/", "/"), "page");
  });

  it("marca `true` en las páginas que cuelgan de la sección", () => {
    assert.equal(navCurrent("/proveedores", "/proveedores/planes"), "true");
    assert.equal(navCurrent("/proveedores", "/proveedores/registro"), "true");
    assert.equal(navCurrent("/proveedores", "/proveedores/contratar"), "true");
    assert.equal(navCurrent("/proveedores", "/proveedores/taller-el-tano"), "true");
    assert.equal(navCurrent("/blog", "/blog/mantenimiento"), "true");
    assert.equal(navCurrent("/blog", "/blog/mantenimiento/cambio-de-aceite"), "true");
  });

  it("no marca los links de otras secciones", () => {
    assert.equal(navCurrent("/blog", "/proveedores/planes"), undefined);
    assert.equal(navCurrent("/sobre-nosotros", "/blog"), undefined);
    assert.equal(navCurrent("/proveedores/planes", "/proveedores"), undefined);
    assert.equal(navCurrent("/proveedores/planes", "/proveedores/registro"), undefined);
  });

  it("compara por segmentos, no por prefijo de texto", () => {
    assert.equal(navCurrent("/proveedores", "/proveedores-filtros"), undefined);
    assert.equal(navCurrent("/blog", "/blogs/nota"), undefined);
  });

  it("la raíz nunca es sección de otra página", () => {
    assert.equal(navCurrent("/", "/proveedores"), undefined);
    assert.equal(navCurrent("/", "/blog/mantenimiento"), undefined);
  });

  it("no marca nada si la página no informa su ruta", () => {
    assert.equal(navCurrent("/proveedores", undefined), undefined);
    assert.equal(navCurrent("/proveedores", ""), undefined);
    assert.equal(navCurrent("", "/proveedores"), undefined);
  });

  it("tolera la barra final de los dos lados", () => {
    assert.equal(navCurrent("/proveedores", "/proveedores/"), "page");
    assert.equal(navCurrent("/proveedores/", "/proveedores"), "page");
    assert.equal(navCurrent("/proveedores/", "/proveedores/planes/"), "true");
  });

  it("ignora la query y el hash", () => {
    assert.equal(navCurrent("/proveedores", "/proveedores?rubro=taller&pagina=2"), "page");
    assert.equal(navCurrent("/proveedores", "/proveedores/registro?alta=1"), "true");
    assert.equal(navCurrent("/blog", "/blog/mantenimiento#indice"), "true");
    assert.equal(navCurrent("/cuenta?seccion=plan", "/cuenta"), "page");
    assert.equal(navCurrent("/proveedores", "/?next=/proveedores/planes"), undefined);
  });
});

// Links del submenú de "Proveedores": solo la coincidencia exacta.
describe("navCurrentPage", () => {
  it("marca `page` solo en la página del link", () => {
    assert.equal(navCurrentPage("/proveedores", "/proveedores"), "page");
    assert.equal(navCurrentPage("/proveedores/planes", "/proveedores/planes"), "page");
    assert.equal(navCurrentPage("/proveedores/registro", "/proveedores/registro?alta=1"), "page");
  });

  it("no marca el directorio en las páginas que cuelgan de él", () => {
    assert.equal(navCurrentPage("/proveedores", "/proveedores/planes"), undefined);
    assert.equal(navCurrentPage("/proveedores", "/proveedores/taller-el-tano"), undefined);
  });

  it("no marca los otros sublinks ni una página sin ruta", () => {
    assert.equal(navCurrentPage("/proveedores/planes", "/proveedores/registro"), undefined);
    assert.equal(navCurrentPage("/proveedores/planes", undefined), undefined);
  });
});
