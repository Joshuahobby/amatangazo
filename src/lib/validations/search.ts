import { z } from "zod";

import { experienceLevels, listingCategories } from "@/lib/validations/listing";

export const listingSearchQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  category: z.enum(listingCategories).optional(),
  location: z.string().trim().min(1).optional(),
  sector: z.string().trim().min(1).optional(),
  experienceLevel: z.enum(experienceLevels).optional(),
  subcategory: z.string().trim().min(1).optional(),
  budgetMin: z.coerce.number().int().nonnegative().optional(),
  budgetMax: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type ListingSearchQuery = z.infer<typeof listingSearchQuerySchema>;
