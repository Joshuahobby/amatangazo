import { z } from "zod";

import { pawapayProviders } from "@/lib/pawapay";

export const checkoutRequestSchema = z.object({
  tier: z.enum(["PAY_PER_BOOST", "ANNUAL_SUBSCRIPTION"]),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^2507\d{8}$/, "Enter a Rwandan phone number in the format 2507XXXXXXXX"),
  provider: z.enum(pawapayProviders),
});
