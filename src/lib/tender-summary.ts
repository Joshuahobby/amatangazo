import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";

import { isAnthropicConfigured } from "@/lib/ai-flagging";
import { prisma } from "@/lib/prisma";

/**
 * Epic 8 — AI tender summarization. Produces the four plain-language fields
 * SMEs actually need from a tender (deadline / budget / eligibility /
 * required documents) and stores them on TenderDetails.aiSummary*.
 *
 * Source text: the attached tender PDF when there is one (T8.1), otherwise
 * the listing's own title+description — which makes this work for the
 * Umucyo-mirrored tenders that have no attached document.
 */

const MAX_SOURCE_CHARS = 60_000; // ~15k tokens; enough for any tender notice

async function extractPdfText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PDF fetch failed: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

const summarySchema = z.object({
  deadline: z.string().describe("Submission deadline in plain language, e.g. '16 July 2026, 10:00 AM local time'. 'Not stated' if absent."),
  budget: z.string().describe("Budget or estimated value in plain language. 'Not stated' if absent."),
  eligibility: z.string().describe("Who can bid, in 1-2 plain sentences (registration, category, nationality requirements)."),
  requiredDocuments: z.string().describe("Documents a bidder must submit, as a short comma-separated list."),
});

async function summarizeWithClaude(sourceText: string) {
  const client = new Anthropic();
  const message = await client.messages.parse({
    model: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
    max_tokens: 1024,
    output_config: {
      effort: "low",
      format: zodOutputFormat(summarySchema),
    },
    system:
      "You summarize Rwandan public/private tender notices for small businesses. " +
      "Extract only what the text states — never invent deadlines, amounts, or requirements. " +
      "Answer in simple English a non-specialist understands.",
    messages: [{ role: "user", content: sourceText.slice(0, MAX_SOURCE_CHARS) }],
  });
  return message.parsed_output;
}

/**
 * TODO(T0.6): delete once ANTHROPIC_API_KEY is provisioned — copies the
 * structured fields we already store so the card UI is exercisable in dev.
 */
function summarizeWithHeuristic(details: {
  submissionDeadline: Date;
  budgetMin: number | null;
  budgetMax: number | null;
  eligibilitySummary: string | null;
  requiredDocuments: string | null;
}) {
  return {
    deadline: details.submissionDeadline.toDateString(),
    budget:
      details.budgetMin || details.budgetMax
        ? `RWF ${details.budgetMin?.toLocaleString() ?? "?"} – ${details.budgetMax?.toLocaleString() ?? "?"}`
        : "Not stated",
    eligibility: details.eligibilitySummary ?? "Not stated",
    requiredDocuments: details.requiredDocuments ?? "Not stated",
  };
}

export async function generateTenderSummary(listingId: string): Promise<void> {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { tenderDetails: true },
    });
    if (!listing?.tenderDetails) return;

    let summary;
    if (isAnthropicConfigured()) {
      let sourceText = `${listing.title}\n\n${listing.description}`;
      if (listing.tenderDetails.documentUrl) {
        try {
          sourceText += `\n\n--- Attached tender document ---\n${await extractPdfText(listing.tenderDetails.documentUrl)}`;
        } catch (error) {
          console.error(`PDF extraction failed for listing ${listingId}, summarizing description only`, error);
        }
      }
      summary = await summarizeWithClaude(sourceText);
      if (!summary) return;
    } else {
      summary = summarizeWithHeuristic(listing.tenderDetails);
    }

    await prisma.tenderDetails.update({
      where: { listingId },
      data: {
        aiSummaryDeadline: summary.deadline,
        aiSummaryBudget: summary.budget,
        aiSummaryEligibility: summary.eligibility,
        aiSummaryDocuments: summary.requiredDocuments,
        aiSummaryGeneratedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Tender summarization failed for listing ${listingId}`, error);
  }
}

/** Backfill: summarize tenders that don't have a summary yet (admin-triggered batches). */
export async function generateMissingSummaries(limit = 10): Promise<{ processed: number; remaining: number }> {
  const missing = await prisma.tenderDetails.findMany({
    where: { aiSummaryGeneratedAt: null, listing: { status: "LIVE" } },
    select: { listingId: true },
    take: limit,
  });

  for (const { listingId } of missing) {
    await generateTenderSummary(listingId);
  }

  const remaining = await prisma.tenderDetails.count({
    where: { aiSummaryGeneratedAt: null, listing: { status: "LIVE" } },
  });
  return { processed: missing.length, remaining };
}
