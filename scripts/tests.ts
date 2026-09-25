// npx tsx --env-file=.env scripts/tests.ts

import { prisma } from "@/lib/prisma";

async function main() {
  const firstUser = await prisma.user.findFirst();

  if (!firstUser) {
    throw new Error("No users found");
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: firstUser.id },
    include: { items: { select: { productId: true } } },
  });

  console.log(wishlist);
}

main()
.catch((err) => {
  console.error(err);
  process.exit(1);
})
.finally(async () => {
  await prisma.$disconnect();
});