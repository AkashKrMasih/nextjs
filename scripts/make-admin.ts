/**
 * Usage:
 *   npx tsx scripts/make-admin.ts user@example.com
 *
 * Promotes the user with the given email to ADMIN role.
 * Adjust the import path below to match your generated client output
 * (see `generator client { output = ... }` in schema.prisma).
 */
import "dotenv/config"; // Next.js loads .env for you at runtime; a standalone script needs this
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`User ${email} is already an ADMIN.`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`Success: ${updated.email} is now ${updated.role}.`);
}

main()
  .catch((err) => {
    console.error("Failed to update role:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
