import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PROVIDER_LOGO_MAX_BYTES,
  validBrandSelection,
  validProviderLogo,
  parseProviderProfileFields,
  appendProviderBrand,
  findTooLongProviderText,
  isValidProviderEmail,
  normalizeProviderSocialLink,
} from "../../lib/proveedores/registration.ts";

describe("registro de proveedores", () => {
  it("acepta emails comunes, recortando espacios", () => {
    for (const email of [
      "taller@gmail.com",
      " Juan.Perez+alta@negocio.com.ar ",
      "ventas_2024@mi-taller.ar",
    ]) {
      assert.equal(isValidProviderEmail(email), true, email);
    }
  });
  it("rechaza los emails que el backend rebota", () => {
    for (const email of [
      "",
      "taller",
      "taller@gmail",
      "taller@gmail.",
      "taller@.com",
      ".taller@gmail.com",
      "ta..ller@gmail.com",
      "taller.@gmail.com",
      "mi taller@gmail.com",
      "taller@gmail.com.123",
      "taller@-gmail.com",
      "taller@gmail_.com",
      "talléres@gmail.com",
      "a@b@gmail.com",
      `${"a".repeat(65)}@gmail.com`,
      `a@${"b".repeat(250)}.com`,
    ]) {
      assert.equal(isValidProviderEmail(email), false, email);
    }
  });
  it("arma el link del perfil a partir del usuario", () => {
    const cases = [
      [
        "instagram",
        "ramirosarasola",
        "https://www.instagram.com/ramirosarasola",
      ],
      [
        "instagram",
        " @taller.belgrano_22 ",
        "https://www.instagram.com/taller.belgrano_22",
      ],
      ["tiktok", "@taller.belgrano", "https://www.tiktok.com/@taller.belgrano"],
      ["youtube", "tallerbelgrano", "https://www.youtube.com/@tallerbelgrano"],
      [
        "facebook",
        "taller.belgrano",
        "https://www.facebook.com/taller.belgrano",
      ],
    ] as const;
    for (const [network, input, expected] of cases) {
      assert.equal(
        normalizeProviderSocialLink(network, input),
        expected,
        input,
      );
    }
  });
  it("acepta links de la red, con o sin protocolo", () => {
    const cases = [
      ["instagram", "instagram.com/taller", "https://instagram.com/taller"],
      [
        "instagram",
        "www.instagram.com/taller?igsh=abc",
        "https://www.instagram.com/taller?igsh=abc",
      ],
      [
        "youtube",
        " https://www.youtube.com/@mitaller ",
        "https://www.youtube.com/@mitaller",
      ],
      [
        "facebook",
        "https://m.facebook.com/profile.php?id=1000",
        "https://m.facebook.com/profile.php?id=1000",
      ],
      [
        "facebook",
        "https://facebook.com/taller ñandú",
        "https://facebook.com/taller%20%C3%B1and%C3%BA",
      ],
      [
        "tiktok",
        "https://vm.tiktok.com/ZMabc/",
        "https://vm.tiktok.com/ZMabc/",
      ],
      [
        "linkedin",
        "linkedin.com/company/taller",
        "https://linkedin.com/company/taller",
      ],
    ] as const;
    for (const [network, input, expected] of cases) {
      assert.equal(
        normalizeProviderSocialLink(network, input),
        expected,
        input,
      );
    }
  });
  it("no adivina: rechaza otros dominios, LinkedIn sin link y el dominio pelado", () => {
    const cases = [
      ["instagram", "https://taller.belgrano"],
      ["instagram", "https://@taller.belgrano"],
      ["instagram", "https://mitaller.com.ar"],
      ["instagram", "https://www.facebook.com/taller"],
      ["instagram", "instagram.com"],
      ["instagram", "https://www.instagram.com/"],
      ["instagram", "taller belgrano"],
      ["instagram", "a".repeat(31)],
      ["linkedin", "@taller"],
      ["linkedin", "taller"],
      ["facebook", "Taller Belgrano"],
      ["instagram", `https://instagram.com/${"a".repeat(2048)}`],
    ] as const;
    for (const [network, input] of cases) {
      assert.equal(normalizeProviderSocialLink(network, input), null, input);
    }
  });
  it("detecta el primer texto libre que supera el maximo del backend", () => {
    assert.equal(
      findTooLongProviderText({
        taller: " " + "a".repeat(120) + " ",
        direccion: "a".repeat(250),
        hours: "a".repeat(500),
        service_other: null,
      }),
      null,
    );
    assert.equal(
      findTooLongProviderText({ taller: "a".repeat(121) }),
      "taller",
    );
    assert.equal(
      findTooLongProviderText({ direccion: "a".repeat(251) }),
      "direccion",
    );
    assert.equal(findTooLongProviderText({ hours: "a".repeat(501) }), "hours");
    assert.equal(
      findTooLongProviderText({ how_found_other: "a".repeat(501) }),
      "how_found_other",
    );
  });
  it("permite marcas libres sin repetirlas por mayusculas o espacios", () => {
    assert.deepEqual(appendProviderBrand(["Ford"], "  ford  "), ["Ford"]);
    assert.deepEqual(appendProviderBrand(["Ford"], "  Nueva   Marca "), [
      "Ford",
      "Nueva Marca",
    ]);
    assert.deepEqual(appendProviderBrand([], " "), []);
    assert.deepEqual(appendProviderBrand([], "a".repeat(101)), []);
  });
  it("la descripcion acepta 90 caracteres y rechaza 91", () => {
    assert.deepEqual(
      parseProviderProfileFields("  " + "a".repeat(90) + "  ", undefined),
      { ok: true, description: "a".repeat(90) },
    );
    assert.deepEqual(parseProviderProfileFields("a".repeat(91), undefined), {
      ok: false,
      kind: "description",
    });
    assert.equal(parseProviderProfileFields(123, undefined).ok, false);
  });
  it("descripcion y redes pueden quedar vacias", () => {
    assert.deepEqual(parseProviderProfileFields("  ", { instagram: "" }), {
      ok: true,
    });
    assert.deepEqual(parseProviderProfileFields(undefined, undefined), {
      ok: true,
    });
  });
  it("normaliza los links y admite solo protocolos navegables", () => {
    assert.deepEqual(
      parseProviderProfileFields(undefined, {
        instagram: " https://instagram.com/negocio ",
        facebook: "",
      }),
      { ok: true, socialLinks: { instagram: "https://instagram.com/negocio" } },
    );
    assert.deepEqual(
      parseProviderProfileFields(undefined, { instagram: "@negocio" }),
      {
        ok: true,
        socialLinks: { instagram: "https://www.instagram.com/negocio" },
      },
    );
    for (const instagram of [
      "javascript:alert(1)",
      "ftp://instagram.com/negocio",
      "https://user:pass@instagram.com/negocio",
    ]) {
      assert.deepEqual(parseProviderProfileFields(undefined, { instagram }), {
        ok: false,
        kind: "socialLinks",
        network: "instagram",
      });
    }
  });
  it("rechaza redes desconocidas y valores mal formados", () => {
    for (const links of [
      [],
      null,
      "https://example.com",
      { other: "https://example.com" },
      { instagram: 1 },
    ]) {
      assert.equal(parseProviderProfileFields(undefined, links).ok, false);
    }
  });
  it("permite todas las marcas con especialidades o sin ellas", () => {
    assert.equal(validBrandSelection(true, [], ["Toyota"]), true);
    assert.equal(validBrandSelection(true, [], []), true);
  });
  it("exige marcas cuando se restringe la cobertura", () => {
    assert.equal(validBrandSelection(false, [], []), false);
    assert.equal(validBrandSelection(false, ["Toyota"], []), true);
  });
  it("las especialidades deben ser marcas atendidas", () => {
    assert.equal(validBrandSelection(false, ["Toyota"], ["Toyota"]), true);
    assert.equal(validBrandSelection(false, ["Toyota"], ["Ford"]), false);
  });
  it("acepta logos PNG, JPEG y WebP hasta el limite inclusive", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      assert.equal(
        validProviderLogo({ type, size: PROVIDER_LOGO_MAX_BYTES }),
        true,
      );
    }
  });
  it("rechaza archivos vacios, grandes y otros formatos", () => {
    assert.equal(validProviderLogo({ type: "image/png", size: 0 }), false);
    assert.equal(
      validProviderLogo({
        type: "image/png",
        size: PROVIDER_LOGO_MAX_BYTES + 1,
      }),
      false,
    );
    assert.equal(
      validProviderLogo({ type: "image/svg+xml", size: 100 }),
      false,
    );
    assert.equal(
      validProviderLogo({ type: "application/pdf", size: 100 }),
      false,
    );
  });
});
