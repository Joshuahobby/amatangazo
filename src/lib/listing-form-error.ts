type RawIssue = {
  path: (string | number)[];
  code: string;
  message: string;
  minimum?: number;
  origin?: string;
  format?: string;
  expected?: string;
};

const FIELD_LABEL_KEYS: Record<string, string> = {
  title: "fieldTitle",
  description: "fieldDescription",
  location: "fieldLocation",
  language: "fieldLanguage",
  sector: "fieldSector",
  experienceLevel: "fieldExperienceLevel",
  applicationDeadline: "fieldApplicationDeadline",
  applicationMethod: "fieldApplicationMethod",
  applicationUrl: "fieldApplicationUrl",
  applicationEmail: "fieldApplicationEmail",
  salaryRangeMin: "fieldSalaryRangeMin",
  salaryRangeMax: "fieldSalaryRangeMax",
  budgetMin: "fieldBudgetMin",
  budgetMax: "fieldBudgetMax",
  submissionDeadline: "fieldSubmissionDeadline",
  eligibilitySummary: "fieldEligibilitySummary",
  requiredDocuments: "fieldRequiredDocuments",
  documentUrl: "fieldDocumentUrl",
  startingPrice: "fieldStartingPrice",
  currency: "fieldCurrency",
  auctionDate: "fieldAuctionDate",
  auctionLocation: "fieldAuctionLocation",
  registrationContactPhone: "fieldRegistrationContactPhone",
  registrationContactWhatsapp: "fieldRegistrationContactWhatsapp",
  registrationContactEmail: "fieldRegistrationContactEmail",
  subcategory: "fieldSubcategory",
  price: "fieldPrice",
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

function describeIssue(issue: RawIssue, t: Translate): string {
  switch (issue.code) {
    case "too_small":
      if (issue.origin === "string") {
        return issue.minimum && issue.minimum > 1
          ? t("errorMinLength", { count: issue.minimum })
          : t("errorRequired");
      }
      return t("errorMinValue", { count: issue.minimum ?? 0 });
    case "invalid_format":
      if (issue.format === "url") return t("errorInvalidUrl");
      if (issue.format === "email") return t("errorInvalidEmail");
      return t("errorInvalid");
    case "invalid_type":
      if (issue.expected === "date") return t("errorInvalidDate");
      if (issue.expected === "number") return t("errorInvalidNumber");
      return t("errorInvalid");
    case "custom":
      return t("errorRequired");
    default:
      return t("errorInvalid");
  }
}

/** Turns a /api/listings error response into human sentences, using the "post" translation namespace for field labels. */
export function formatListingFormErrors(data: unknown, t: Translate): string[] {
  const error = (data as { error?: unknown } | null)?.error;

  if (typeof error === "string") return [error];

  if (error && typeof error === "object" && Array.isArray((error as { issues?: unknown }).issues)) {
    const issues = (error as { issues: RawIssue[] }).issues;
    if (issues.length === 0) return [t("genericError")];
    return issues.map((issue) => {
      const key = issue.path[issue.path.length - 1];
      const labelKey = typeof key === "string" ? FIELD_LABEL_KEYS[key] : undefined;
      const label = labelKey ? t(labelKey) : typeof key === "string" ? key : "";
      const description = describeIssue(issue, t);
      return label ? `${label} ${description}.` : `${description}.`;
    });
  }

  return [t("genericError")];
}
