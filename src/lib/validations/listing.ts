import { z } from "zod";

export const experienceLevels = ["INTERNSHIP", "ENTRY", "MID", "SENIOR", "NOT_SPECIFIED"] as const;
export const applicationMethods = ["PLATFORM", "EXTERNAL_URL", "EMAIL"] as const;
export const preferredLanguages = ["EN", "FR", "RW"] as const;
export const listingCategories = ["JOB", "TENDER", "AUCTION", "CLASSIFIED"] as const;

/**
 * Categories with a discovery angle worth highlighting above the browse results
 * (see `src/lib/discovery.ts`). CLASSIFIED has none — "cheapest first" is the
 * price sort, not an editorial signal. Lives here rather than in `lib/discovery`
 * so the client-side strip can read it without pulling Prisma into the bundle.
 */
export const discoveryCategories = ["JOB", "TENDER", "AUCTION"] as const;

export type DiscoveryCategory = (typeof discoveryCategories)[number];

export function isDiscoveryCategory(value: string): value is DiscoveryCategory {
  return (discoveryCategories as readonly string[]).includes(value);
}

const baseListingFields = {
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10),
  location: z.string().trim().min(1),
  language: z.enum(preferredLanguages).default("EN"),
};

export const jobDetailsObjectSchema = z.object({
  sector: z.string().trim().min(1),
  experienceLevel: z.enum(experienceLevels).default("NOT_SPECIFIED"),
  applicationDeadline: z.coerce.date(),
  applicationMethod: z.enum(applicationMethods).default("PLATFORM"),
  applicationUrl: z.string().trim().url().optional(),
  applicationEmail: z.string().trim().email().optional(),
  salaryRangeMin: z.coerce.number().int().nonnegative().optional(),
  salaryRangeMax: z.coerce.number().int().nonnegative().optional(),
});

// .partial() can't be applied to a refined schema, so the create-time refinements
// live on this wrapper; updateListingSchema partials the plain object above instead.
export const jobDetailsSchema = jobDetailsObjectSchema
  .refine((data) => data.applicationMethod !== "EXTERNAL_URL" || !!data.applicationUrl, {
    message: "applicationUrl is required when applicationMethod is EXTERNAL_URL",
    path: ["applicationUrl"],
  })
  .refine((data) => data.applicationMethod !== "EMAIL" || !!data.applicationEmail, {
    message: "applicationEmail is required when applicationMethod is EMAIL",
    path: ["applicationEmail"],
  });

export const tenderDetailsSchema = z.object({
  sector: z.string().trim().min(1),
  budgetMin: z.coerce.number().int().nonnegative().optional(),
  budgetMax: z.coerce.number().int().nonnegative().optional(),
  submissionDeadline: z.coerce.date(),
  eligibilitySummary: z.string().trim().optional(),
  requiredDocuments: z.string().trim().optional(),
  documentUrl: z.string().trim().url().optional(),
});

export const auctionDetailsSchema = z.object({
  startingPrice: z.coerce.number().int().nonnegative().optional(),
  currency: z.string().trim().default("RWF"),
  auctionDate: z.coerce.date(),
  auctionLocation: z.string().trim().min(1),
  registrationContactPhone: z.string().trim().optional(),
  registrationContactWhatsapp: z.string().trim().optional(),
  registrationContactEmail: z.string().trim().email().optional(),
});

export const classifiedDetailsSchema = z.object({
  subcategory: z.string().trim().min(1),
  price: z.coerce.number().int().nonnegative().optional(),
  // Poster-provided public contact — never the private auth User.phoneNumber.
  // Kept lenient: Rwandan numbers get written in many formats.
  contactPhone: z.string().trim().max(30).optional(),
  contactWhatsapp: z.string().trim().max(30).optional(),
});

export const createListingSchema = z.discriminatedUnion("category", [
  z.object({ category: z.literal("JOB"), ...baseListingFields, details: jobDetailsSchema }),
  z.object({ category: z.literal("TENDER"), ...baseListingFields, details: tenderDetailsSchema }),
  z.object({ category: z.literal("AUCTION"), ...baseListingFields, details: auctionDetailsSchema }),
  z.object({
    category: z.literal("CLASSIFIED"),
    ...baseListingFields,
    details: classifiedDetailsSchema,
  }),
]);

export type CreateListingInput = z.infer<typeof createListingSchema>;

export type ListingCategory = (typeof listingCategories)[number];

/**
 * The detail fields a PATCH may touch, for a listing already known to be in
 * this category.
 *
 * Category is a parameter rather than a fifth union member because a union
 * cannot tell these apart. Zod returns the first branch that parses, and every
 * branch here is `.partial()` — so `{}` satisfies the job branch immediately,
 * unknown keys get stripped by default, and *every* payload came back as `{}`.
 * The route then handed Prisma an empty `update`, which is a no-op that still
 * answers 200: editing a classified's price or a job's salary looked like it
 * worked and saved nothing.
 *
 * `.strict()` rather than the default strip, for the same reason. A field that
 * belongs to another category is a caller bug, and silence is how the original
 * defect stayed invisible — it should be a 400 the client can show.
 */
function detailsUpdateSchema(category: ListingCategory) {
  switch (category) {
    case "JOB":
      return asPatch(jobDetailsObjectSchema);
    case "TENDER":
      return asPatch(tenderDetailsSchema);
    case "AUCTION":
      return asPatch(auctionDetailsSchema);
    case "CLASSIFIED":
      return asPatch(classifiedDetailsSchema);
  }
}

/**
 * A create-time schema turned into a patch: every field optional, defaults
 * dropped, unknown keys rejected.
 *
 * Dropping the defaults is the part that isn't obvious. `.partial()` makes a
 * field optional but leaves its `.default()` in place, so an auction PATCH
 * carrying only `startingPrice` still parses to `{ startingPrice, currency:
 * "RWF" }` — and the route writes both, quietly resetting a currency the
 * poster had chosen. A job PATCH carrying only a salary likewise resets
 * `experienceLevel` to NOT_SPECIFIED. A default is right on create, where the
 * field is genuinely absent; on a partial update it overwrites a value the
 * caller never mentioned and cannot see.
 *
 * Done by walking the shape rather than naming the two fields that have
 * defaults today, so adding a third to a create schema can't quietly
 * reintroduce this.
 */
function asPatch<T extends Record<string, z.ZodType>>(schema: z.ZodObject<T>) {
  const shape = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => {
      const undefaulted = field instanceof z.ZodDefault ? (field.removeDefault() as z.ZodType) : field;
      return [key, undefaulted.optional()];
    }),
  );
  return z.strictObject(shape);
}

export function updateListingSchema(category: ListingCategory) {
  return z.object({
    title: baseListingFields.title.optional(),
    description: baseListingFields.description.optional(),
    location: baseListingFields.location.optional(),
    language: baseListingFields.language.optional(),
    details: detailsUpdateSchema(category).optional(),
  });
}

export type UpdateListingInput = z.infer<ReturnType<typeof updateListingSchema>>;

export const listingQuerySchema = z.object({
  category: z.enum(listingCategories).optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
