import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const demoUsers = [
    {
      phoneNumber: "+250788000001",
      name: "Demo Employer",
      businessName: "Kigali Tech Ltd",
      accountType: "BUSINESS" as const,
    },
    {
      phoneNumber: "+250788000002",
      name: "Demo Job Seeker",
      accountType: "INDIVIDUAL" as const,
    },
    {
      phoneNumber: "+250788000003",
      name: "Demo Admin",
      accountType: "INDIVIDUAL" as const,
      isAdmin: true,
    },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { phoneNumber: user.phoneNumber },
      update: {},
      create: user,
    });
  }

  console.log(`Seeded ${demoUsers.length} demo users.`);

  // Rates confirmed in the PRD's Monetization & Pricing section, category: null = applies to all categories
  const pricingRates = [
    { tier: "PAY_PER_BOOST" as const, price: 10000 },
    { tier: "ANNUAL_SUBSCRIPTION" as const, price: 300000 },
    { tier: "SUBSCRIBER_BOOST_DISCOUNT" as const, price: 8000 },
  ];

  // Prisma's compound-unique `where` input rejects `null` for a nullable
  // field, so a plain findFirst+create/update stands in for upsert here.
  for (const rate of pricingRates) {
    const existing = await prisma.pricingConfig.findFirst({
      where: { tier: rate.tier, category: null },
    });
    if (existing) {
      await prisma.pricingConfig.update({ where: { id: existing.id }, data: { price: rate.price } });
    } else {
      await prisma.pricingConfig.create({ data: { tier: rate.tier, category: null, price: rate.price } });
    }
  }

  console.log(`Seeded ${pricingRates.length} pricing rates.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
