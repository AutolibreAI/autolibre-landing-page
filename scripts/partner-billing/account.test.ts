import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countOrdersByFilter, isActionableOrder, matchesOrderFilter } from "../../lib/account/orders.ts";
import {
  appHeadline,
  appLocationLine,
  monogramToneFor,
  parsePartnerDetail,
  parsePartnerDetailResponse,
  partnerInitials,
  profileChecklist,
} from "../../lib/account/partner-profile.ts";
import { livePlanCode, parsePlanLimits, planStateFor, trialOfferFor } from "../../lib/account/plan-state.ts";
import {
  accountSectionHref,
  parseAccountPartnerParam,
  parseAccountSection,
  pickAccountPartner,
} from "../../lib/account/sections.ts";

const ID = "3f2a1c4e-8b7d-4e6f-9a01-23456789abcd";

describe("secciones de /cuenta", () => {
  it("parsea la sección y cae en el Resumen con cualquier otra cosa", () => {
    assert.equal(parseAccountSection("plan"), "plan");
    assert.equal(parseAccountSection(" PERFIL "), "perfil");
    assert.equal(parseAccountSection(["pedidos", "plan"]), "pedidos");
    assert.equal(parseAccountSection("admin"), "resumen");
    assert.equal(parseAccountSection(undefined), "resumen");
  });

  it("acepta solo un UUID como negocio", () => {
    assert.equal(parseAccountPartnerParam(ID.toUpperCase()), ID);
    assert.equal(parseAccountPartnerParam("../otro"), null);
    assert.equal(parseAccountPartnerParam(undefined), null);
  });

  it("elige el negocio pedido solo si la cuenta es dueña; si no, el primero", () => {
    const partners = [{ partnerId: "a" }, { partnerId: ID }];
    assert.equal(pickAccountPartner(partners, ID)?.partnerId, ID);
    assert.equal(pickAccountPartner(partners, "ajeno")?.partnerId, "a");
    assert.equal(pickAccountPartner([], ID), null);
  });

  it("arma el href sin query para el Resumen", () => {
    assert.equal(accountSectionHref("/cuenta", "resumen"), "/cuenta");
    assert.equal(accountSectionHref("/cuenta", "plan"), "/cuenta?seccion=plan");
    assert.equal(accountSectionHref("/cuenta", "resumen", ID), `/cuenta?negocio=${ID}`);
  });
});

const DETAIL = {
  id: ID,
  name: "Taller San Martín",
  description: null,
  logoUrl: null,
  whatsapp: "+54 11 2345-6789",
  address: "Av. Siempreviva 742, San Martín",
  hours: null,
  modality: "Taller fijo",
  redirectLink: null,
  whatsappContactUrl: "https://wa.me/5491123456789",
  coverageZone: "San Martín",
  geo: null,
  tier: "standard",
  services: ["frenos"],
  categories: ["Tren rodante y frenos", "Motor"],
  serviceGroups: [
    { category: { slug: "tren", name: "Tren rodante y frenos" }, items: [{ slug: "frenos", name: "Frenos" }] },
    { category: { slug: "vacia", name: "Vacía" }, items: [] },
  ],
  cover: { url: "https://x/stock.jpg", width: 1, height: 1, isPlaceholder: true },
  brands: [],
  fuelTypes: [],
  links: [{ kind: "instagram", url: "https://instagram.com/x" }],
  rating: null,
  reviews: [],
};

describe("perfil del negocio (GET /partners/{id})", () => {
  it("parsea el detalle y descarta la portada de stock y las familias vacías", () => {
    const profile = parsePartnerDetail(DETAIL);
    assert.ok(profile);
    assert.equal(profile.coverUrl, null);
    assert.equal(profile.contactUrl, "https://wa.me/5491123456789");
    assert.deepEqual(
      profile.serviceGroups.map((group) => group.slug),
      ["tren"],
    );
  });

  it("404 es 'no visible' (pausado o archivado), no un error", () => {
    assert.deepEqual(parsePartnerDetailResponse(404, null), { kind: "not-visible" });
    assert.deepEqual(parsePartnerDetailResponse(500, null), { kind: "unknown" });
    assert.deepEqual(parsePartnerDetailResponse(200, { id: ID }), { kind: "unknown" });
  });

  it("cuenta lo que falta del perfil", () => {
    const profile = parsePartnerDetail(DETAIL);
    assert.ok(profile);
    const checklist = profileChecklist(profile);
    assert.equal(checklist.total, 8);
    assert.deepEqual(checklist.missing, ["logo", "description", "hours"]);
    assert.equal(checklist.done, 5);
  });

  it("replica las iniciales, el tono y los textos de la app", () => {
    assert.equal(partnerInitials("H&G Cars Service"), "HC");
    assert.equal(partnerInitials("  "), "?");
    assert.ok(["dark", "soft", "gray"].includes(monogramToneFor(ID)));
    assert.equal(monogramToneFor(ID), monogramToneFor(ID));
    assert.equal(appHeadline({ categories: [], modality: null }), "Taller");
    assert.equal(appLocationLine({ address: null, coverageZone: "Caseros" }), "Caseros");
  });
});

const BASE = {
  planCode: "plus",
  status: "trialing",
  trialEndsAt: "2026-12-18T03:00:00Z",
  currentPeriodEnd: null,
  accessUntil: null,
  cancelAtPeriodEnd: false,
  trialEligible: false,
};

describe("estado del plan", () => {
  it("clasifica cada estado de la suscripción", () => {
    assert.deepEqual(planStateFor(BASE), { kind: "trial", plan: "plus", until: BASE.trialEndsAt });
    assert.equal(planStateFor({ ...BASE, status: "active" }).kind, "active");
    assert.equal(planStateFor({ ...BASE, status: null, planCode: "free" }).kind, "free");
    assert.deepEqual(planStateFor({ ...BASE, status: "pending" }), { kind: "pending", requestedPlan: "plus" });
    assert.equal(planStateFor({ ...BASE, status: "paused" }).kind, "other");
    assert.deepEqual(planStateFor({ ...BASE, cancelAtPeriodEnd: true, accessUntil: "2026-12-18" }), {
      kind: "canceling",
      plan: "plus",
      until: "2026-12-18",
    });
  });

  it("solo trial, active y canceling tienen plan vigente", () => {
    assert.equal(livePlanCode(planStateFor(BASE)), "plus");
    assert.equal(livePlanCode(planStateFor({ ...BASE, status: "pending" })), null);
  });

  it("lee el tope mensual de cada plan", () => {
    assert.deepEqual(
      parsePlanLimits([
        { code: "plus", monthlyWhatsappRequestLimit: 5 },
        { code: "plus_max", monthlyWhatsappRequestLimit: 12 },
        { code: "raro", monthlyWhatsappRequestLimit: "x" },
      ]),
      { plus: 5, plus_max: 12 },
    );
    assert.deepEqual(parsePlanLimits(null), {});
  });

  it("promete la prueba solo si el backend la confirma", () => {
    assert.deepEqual(trialOfferFor(30, true), { kind: "days", days: 30 });
    assert.deepEqual(trialOfferFor(30, null), { kind: "conditional" });
    assert.deepEqual(trialOfferFor(30, false), { kind: "none" });
    assert.deepEqual(trialOfferFor(0, true), { kind: "none" });
  });
});

describe("pedidos (modelo, apagado)", () => {
  const orders = [{ status: "responder" }, { status: "detalle" }, { status: "elegido" }, { status: "cerrado" }] as const;

  it("'Por responder' junta responder y detalle", () => {
    assert.equal(matchesOrderFilter({ status: "detalle" }, "responder"), true);
    assert.deepEqual(countOrdersByFilter(orders), { todos: 4, responder: 2, propuesta: 0, elegido: 1, cerrado: 1 });
  });

  it("la acción principal va en los estados con algo por hacer", () => {
    assert.equal(isActionableOrder("responder"), true);
    assert.equal(isActionableOrder("cerrado"), false);
  });
});
