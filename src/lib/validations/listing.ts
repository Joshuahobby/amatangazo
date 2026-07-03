import { z } from "zod";

export const experienceLevels = ["INTERNSHIP", "ENTRY", "MID", "SENIOR", "NOT_SPECIFIED"] as const;
export const applicationMethods = ["PLATFORM", "EXTERNAL_URL", "EMAIL"] as const;
export const preferredLanguages = ["EN", "FR", "RW"] as const;
export const listingCategories = ["JOB", "TENDER", "AUCTION", "CLASSIFIED"] as const;

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

export const updateListingSchema = z.object({
  title: baseListingFields.title.optional(),
  description: baseListingFields.description.optional(),
  location: baseListingFields.location.optional(),
  language: baseListingFields.language.optional(),
  details: z
    .union([
      jobDetailsObjectSchema.partial(),
      tenderDetailsSchema.partial(),
      auctionDetailsSchema.partial(),
      classifiedDetailsSchema.partial(),
    ])
    .optional(),
});

export type UpdateListingInput = z.infer<typeof updateListingSchema>;

export const listingQuerySchema = z.object({
  category: z.enum(listingCategories).optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
