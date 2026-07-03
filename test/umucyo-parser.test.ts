import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildSourceUrl, parseTenderDetailHtml, parseTenderListHtml } from "@/lib/umucyo";

const listHtml = readFileSync(fileURLToPath(new URL("./fixtures/umucyo_list.html", import.meta.url)), "utf8");
const detailHtml = readFileSync(fileURLToPath(new URL("./fixtures/umucyo_detail.html", import.meta.url)), "utf8");

describe("parseTenderListHtml", () => {
  const tenders = parseTenderListHtml(listHtml);

  it("extracts one record per tenderNo radio row", () => {
    expect(tenders).toHaveLength(10);
  });

  it("populates the required identity + classification fields on every row", () => {
    for (const t of tenders) {
      expect(t.tendReferNo).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.status).toBeTruthy();
      // stage/method/type codes come from the pipe record — never undefined
      expect(t.stageCd).toBeTruthy();
      expect(t.methodCd).toBeTruthy();
      expect(t.typeCd).toBeTruthy();
    }
  });

  it("parses dd/MM/yyyy HH:mm deadlines into real Dates (not the cell-index-off-by-one bug)", () => {
    const withDeadline = tenders.filter((t) => t.submissionDeadline !== null);
    expect(withDeadline.length).toBeGreaterThan(0);
    for (const t of withDeadline) {
      expect(t.submissionDeadline).toBeInstanceOf(Date);
      expect(Number.isNaN(t.submissionDeadline!.getTime())).toBe(false);
      // sanity: Umucyo tenders are dated this decade, not 1970 (a mis-parse)
      expect(t.submissionDeadline!.getUTCFullYear()).toBeGreaterThan(2020);
    }
  });

  it("decodes HTML entities in titles rather than leaking raw &amp;/&#39;", () => {
    for (const t of tenders) {
      expect(t.title).not.toMatch(/&amp;|&#39;|&quot;|&lt;|&gt;/);
    }
  });

  it("does not treat the Status column value as a date (regression: status must be the label, not a timestamp)", () => {
    for (const t of tenders) {
      expect(t.status).not.toMatch(/^\d{2}\/\d{2}\/\d{4}/);
    }
  });
});

describe("parseTenderDetailHtml", () => {
  it("extracts the procuring entity and opening place from a real detail page", () => {
    const detail = parseTenderDetailHtml(detailHtml);
    // At least one of the two label-based fields must resolve on a real page;
    // both being null would mean the <th>label</th><td>value</td> regex broke.
    expect(detail.procuringEntity !== null || detail.openingPlace !== null).toBe(true);
  });

  it("returns nulls (not throws) for unrelated HTML", () => {
    expect(() => parseTenderDetailHtml("<html><body>nothing here</body></html>")).not.toThrow();
    const detail = parseTenderDetailHtml("<html></html>");
    expect(detail.procuringEntity).toBeNull();
    expect(detail.openingPlace).toBeNull();
  });
});

describe("buildSourceUrl", () => {
  it("produces a stable, unique, fragment-keyed backlink usable as a dedup key", () => {
    const ref = "000019/NC/NCB/2025/2026/1417000000";
    const url = buildSourceUrl(ref);
    expect(url).toContain("umucyo.gov.rw");
    expect(url).toContain(`#${encodeURIComponent(ref)}`);
    // two different refs never collide
    expect(buildSourceUrl("A")).not.toBe(buildSourceUrl("B"));
  });
});
