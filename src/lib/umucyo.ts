/**
 * Umucyo (umucyo.gov.rw, Rwanda's e-procurement portal) scraper — T3.1 spike
 * findings, verified live against the real site:
 *
 * - No public API and no robots.txt (404 — nothing disallowed). The site is
 *   a Java/KONEPS frameset app; everything is form-POST driven.
 * - Tender list: POST /eb/bav/selectListAdvertisingListForGU.do with
 *   currentPageNo + recordCountPerPage (10/20/30/50), newest first. Requires
 *   a JSESSIONID cookie from an initial GET to /.
 * - Each result row carries a pipe-delimited record in its radio input:
 *   tendReferNo|name|peCode|deadline|stageCd|methodCd|typeCd|openDateTime|flag
 * - Detail: POST /eb/bav/selectAdvertisingDtlInfo.do with tendReferNo/
 *   tendStageCd/tendTypeCd — <th>Label</th><td>value</td> pairs (Procuring
 *   Entity, Description, Opening Place, ...). POST-only: no GET deep link
 *   exists, so backlinks point at the list page (fragment carries the ref).
 */

const UMUCYO_BASE = "https://www.umucyo.gov.rw";
const LIST_PATH = "/eb/bav/selectListAdvertisingListForGU.do";
const DETAIL_PATH = "/eb/bav/selectAdvertisingDtlInfo.do";
const MENU_ID = "EB01020100";

/** P0-3: "rate-limits requests" — minimum gap between any two requests to Umucyo. */
const REQUEST_GAP_MS = 1500;
const USER_AGENT = "AmatangazoMirror/1.0 (+https://amatangazo.com; tender mirror, contact: info@amatangazo.com)";

export type UmucyoTender = {
  tendReferNo: string; // internal unique ref, e.g. 000019/NC/NCB/2025/2026/1417000000
  displayTenderNo: string; // human-facing, e.g. 000019/NC/NCB/2025/2026/UR
  title: string;
  status: string; // Published | Amended | ...
  advertisedOn: Date | null; // from dd/MM/yyyy
  submissionDeadline: Date | null; // from dd/MM/yyyy HH:mm
  stageCd: string;
  methodCd: string; // NCB | ICB | RFQ | ...
  typeCd: string; // C (consultancy) | NC | G | W ...
};

export type UmucyoTenderDetail = {
  procuringEntity: string | null;
  openingPlace: string | null;
};

let lastRequestAt = 0;

async function politeFetch(url: string, init?: RequestInit): Promise<Response> {
  const wait = lastRequestAt + REQUEST_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
  return fetch(url, {
    ...init,
    headers: { "User-Agent": USER_AGENT, ...init?.headers },
  });
}

/** The list endpoint 302s to an error page without a JSESSIONID from a prior visit. */
async function getSessionCookie(): Promise<string> {
  const response = await politeFetch(UMUCYO_BASE + "/");
  const setCookies = response.headers.getSetCookie?.() ?? [];
  const cookies = setCookies.map((cookie) => cookie.split(";")[0]).filter(Boolean);
  if (!cookies.some((cookie) => cookie.startsWith("JSESSIONID="))) {
    throw new Error("Umucyo did not issue a session cookie — site structure may have changed");
  }
  return cookies.join("; ");
}

function parseUmucyoDate(value: string): Date | null {
  // dd/MM/yyyy or dd/MM/yyyy HH:mm
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!match) return null;
  const [, day, month, year, hour = "0", minute = "0"] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)));
  return Number.isNaN(date.getTime()) ? null : date;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pure HTML→records parser, exported separately from the fetching so it can
 * be exercised against saved fixtures without hitting the live site.
 */
export function parseTenderListHtml(html: string): UmucyoTender[] {
  const tenders: UmucyoTender[] = [];

  // Each row: a radio input with the pipe-delimited record, then row cells.
  const rowPattern = /name="tenderNo"[^>]*value="([^"]+)"[\s\S]*?<\/tr>/g;
  for (const rowMatch of html.matchAll(rowPattern)) {
    const rowHtml = rowMatch[0];
    const parts = rowMatch[1].split("|");
    if (parts.length < 8) continue;

    // parts: ref|title|peCode|deadline(date-only)|stage|method|type|deadline(with time)|flag
    const [tendReferNo, rawTitle, , deadlineDateOnly, stageCd, methodCd, typeCd, deadlineWithTime] = parts;

    const displayNoMatch = rowHtml.match(/<td>\s*([^<]+?)<input type="hidden"/);
    // The row match starts inside the radio's own cell, so the first
    // `<td class="tC">` seen here is already the Status column.
    const cellValues = [...rowHtml.matchAll(/<td class="tC">\s*([\s\S]*?)\s*<\/td>/g)].map((m) =>
      decodeEntities(m[1].replace(/<[^>]+>/g, "")),
    );
    const status = cellValues[0] ?? "";
    const advertisingDate = cellValues[1] ?? "";

    const deadline = parseUmucyoDate(deadlineWithTime) ?? parseUmucyoDate(deadlineDateOnly);

    tenders.push({
      tendReferNo: decodeEntities(tendReferNo),
      displayTenderNo: displayNoMatch ? decodeEntities(displayNoMatch[1]) : decodeEntities(tendReferNo),
      title: decodeEntities(rawTitle),
      status,
      advertisedOn: parseUmucyoDate(advertisingDate),
      submissionDeadline: deadline,
      stageCd,
      methodCd,
      typeCd,
    });
  }

  return tenders;
}

export function parseTenderDetailHtml(html: string): UmucyoTenderDetail {
  // Labels sit inside <th> alongside an optional <span class="important">
  // marker, with newlines/indentation around everything.
  function fieldAfterLabel(label: string): string | null {
    const pattern = new RegExp(
      `<th[^>]*>\\s*(?:<span[^>]*>[\\s\\S]*?</span>)?\\s*${label}\\s*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`,
      "i",
    );
    const match = html.match(pattern);
    if (!match) return null;
    const text = decodeEntities(match[1].replace(/<[^>]+>/g, ""));
    return text || null;
  }

  return {
    procuringEntity: fieldAfterLabel("Advertising/Procuring Entity"),
    openingPlace: fieldAfterLabel("Opening Place"),
  };
}

export async function fetchTenderListPage(cookie: string, pageNo: number, perPage = 50): Promise<UmucyoTender[]> {
  const response = await politeFetch(UMUCYO_BASE + LIST_PATH, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      menuId: MENU_ID,
      currentPageNo: String(pageNo),
      recordCountPerPage: String(perPage),
    }),
  });
  if (!response.ok) {
    throw new Error(`Umucyo list page ${pageNo} returned ${response.status}`);
  }
  return parseTenderListHtml(await response.text());
}

export async function fetchTenderDetail(cookie: string, tender: UmucyoTender): Promise<UmucyoTenderDetail> {
  const response = await politeFetch(UMUCYO_BASE + DETAIL_PATH, {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      menuId: MENU_ID,
      tendReferNo: tender.tendReferNo,
      tendStageCd: tender.stageCd,
      tendTypeCd: tender.typeCd,
    }),
  });
  if (!response.ok) {
    throw new Error(`Umucyo detail for ${tender.tendReferNo} returned ${response.status}`);
  }
  return parseTenderDetailHtml(await response.text());
}

/**
 * Detail pages are POST-only, so there's no per-tender deep link. The
 * backlink lands on the advertisement list; the fragment carries the ref so
 * each mirrored tender still has a unique, stable sourceUrl (which doubles
 * as the dedup key in ingestion).
 */
export function buildSourceUrl(tendReferNo: string): string {
  return `${UMUCYO_BASE}${LIST_PATH}?menuId=${MENU_ID}#${encodeURIComponent(tendReferNo)}`;
}

export async function scrapeTenders(pages = 2): Promise<UmucyoTender[]> {
  const cookie = await getSessionCookie();
  const all: UmucyoTender[] = [];
  for (let page = 1; page <= pages; page++) {
    all.push(...(await fetchTenderListPage(cookie, page)));
  }
  return all;
}

export { getSessionCookie };
