import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

/**
 * P0-5 AI-assisted flagging. Two independent signals:
 *
 * 1. POSSIBLE_DUPLICATE — pg_trgm title similarity against other current
 *    listings in the same category. Pure Postgres, no vendor, always on.
 * 2. POSSIBLE_SCAM / POSSIBLE_SPAM — Claude classification, gated behind
 *    ANTHROPIC_API_KEY (T0.6 provisions it). Until then a keyword heuristic
 *    stands in so the moderation queue is exercisable in dev.
 *
 * Both only *flag* for human review — they never block or remove a listing
 * themselves (the PRD keeps approve/reject a human decision).
 */

const DUPLICATE_SIMILARITY_THRESHOLD = 0.55;

export function isAnthropicConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

type FlaggableListing = {
  id: string;
  category: string;
  title: string;
  description: string;
  location: string;
};

async function detectDuplicates(listing: FlaggableListing) {
  const rows = await prisma.$queryRaw<{ id: string; sim: number }[]>(Prisma.sql`
    SELECT l.id, similarity(l.title, ${listing.title}) AS sim
    FROM "Listing" l
    WHERE l.id != ${listing.id}
      AND l.category = ${listing.category}::"ListingCategory"
      AND l.status IN ('LIVE', 'PENDING_PAYMENT', 'DRAFT')
      AND similarity(l.title, ${listing.title}) > ${DUPLICATE_SIMILARITY_THRESHOLD}
    ORDER BY sim DESC
    LIMIT 3
  `);

  if (rows.length === 0) return [];
  // One flag per listing, confidence = best match.
  return [{ flagType: "POSSIBLE_DUPLICATE" as const, confidenceScore: Math.min(rows[0].sim, 1) }];
}

const classificationSchema = z.object({
  scamLikelihood: z.number().min(0).max(1).describe("How likely this listing is a scam (fake job/tender fees, advance payment fraud, impersonation)"),
  spamLikelihood: z.number().min(0).max(1).describe("How likely this listing is spam (gibberish, unrelated advertising, keyword stuffing)"),
  reasoning: z.string().describe("One short sentence explaining the scores"),
});

async function classifyWithClaude(listing: FlaggableListing) {
  const client = new Anthropic();

  const message = await client.messages.parse({
    model: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
    max_tokens: 1024,
    output_config: {
      effort: "low",
      format: zodOutputFormat(classificationSchema),
    },
    system:
      "You review listings for a Rwandan jobs/tenders/auctions/classifieds marketplace. " +
      "Score how likely each listing is a scam or spam. Common local scam patterns: " +
      "recruitment-fee fraud, fake government tenders demanding deposits, too-good-to-be-true prices, " +
      "off-platform payment pressure, impersonating known institutions.",
    messages: [
      {
        role: "user",
        content: `Category: ${listing.category}\nLocation: ${listing.location}\nTitle: ${listing.title}\nDescription:\n${listing.description}`,
      },
    ],
  });

  const result = message.parsed_output;
  if (!result) return [];

  const flags: { flagType: "POSSIBLE_SCAM" | "POSSIBLE_SPAM"; confidenceScore: number }[] = [];
  if (result.scamLikelihood >= 0.5) flags.push({ flagType: "POSSIBLE_SCAM", confidenceScore: result.scamLikelihood });
  if (result.spamLikelihood >= 0.5) flags.push({ flagType: "POSSIBLE_SPAM", confidenceScore: result.spamLikelihood });
  return flags;
}

/**
 * TODO(T0.6): delete once ANTHROPIC_API_KEY is provisioned everywhere — this
 * crude keyword check exists only so the flagging pipeline and moderation
 * queue are testable in dev without the vendor.
 */
function classifyWithHeuristic(listing: FlaggableListing) {
  const text = `${listing.title} ${listing.description}`.toLowerCase();
  const scamMarkers = ["registration fee", "processing fee", "pay before", "western union", "send money", "100% guaranteed"];
  const spamMarkers = ["click here", "buy now", "www.", "http://", "!!!"];

  const flags: { flagType: "POSSIBLE_SCAM" | "POSSIBLE_SPAM"; confidenceScore: number }[] = [];
  const scamHits = scamMarkers.filter((marker) => text.includes(marker)).length;
  const spamHits = spamMarkers.filter((marker) => text.includes(marker)).length;
  if (scamHits > 0) flags.push({ flagType: "POSSIBLE_SCAM", confidenceScore: Math.min(0.5 + scamHits * 0.15, 0.95) });
  if (spamHits > 1) flags.push({ flagType: "POSSIBLE_SPAM", confidenceScore: Math.min(0.4 + spamHits * 0.15, 0.9) });
  return flags;
}

/**
 * Fire-and-forget from listing creation — must never throw into the caller
 * and must never block publishing (flags are advisory, for the admin queue).
 */
export async function runAiFlagging(listingId: string): Promise<void> {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return;

    const [duplicateFlags, contentFlags] = await Promise.all([
      detectDuplicates(listing),
      isAnthropicConfigured() ? classifyWithClaude(listing) : Promise.resolve(classifyWithHeuristic(listing)),
    ]);

    const flags = [...duplicateFlags, ...contentFlags];
    if (flags.length === 0) return;

    await prisma.aiFlag.createMany({
      data: flags.map((flag) => ({ listingId, ...flag })),
    });
  } catch (error) {
    console.error(`AI flagging failed for listing ${listingId}`, error);
  }
}
