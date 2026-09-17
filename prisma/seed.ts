import "dotenv/config";
import {faker} from "@faker-js/faker";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const NUM_USERS    = 20;
const NUM_PRODUCTS = 150;

const SALT_ROUNDS = 10;

// Default plaintext password for every seeded fake user, so you have a
// known set of test credentials to log in with. Only used for seeding.
const DEFAULT_PASSWORD = "password123";

async function hashPassword(plainPassword: string) {
  const passwordSalt   = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(plainPassword, passwordSalt);

  return { password: hashedPassword, password_salt: passwordSalt };
}

async function main() {
  console.log("Seeding database...");

  // --- Users ---
  const adminCreds = await hashPassword("password");

  const adminUser = {
    email: "admin@admin.us",
    name:  "Admin",
    role:  "ADMIN",
    ...adminCreds,
  };

  const fakeUsers = await Promise.all(
    Array.from({length: NUM_USERS - 1}).map(async () => {
      const creds = await hashPassword(DEFAULT_PASSWORD);

      return {
        email: faker.internet.email().toLowerCase(),
        name:  faker.person.fullName(),
        role:  "CUSTOMER",
        ...creds,
      };
    })
  );

  const users = [adminUser, ...fakeUsers];

  await prisma.user.createMany({
    data:           users,
    skipDuplicates: true, // in case faker generates a duplicate email
  });

  // --- Products ---
  const products = Array.from({length: NUM_PRODUCTS}).map(() => ({
    name:        faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price:       Number(faker.commerce.price({min: 5, max: 500})),
    stock:       faker.number.int({min: 0, max: 200}),
    imageUrl:    faker.image.urlPicsumPhotos(),
  }));

  await prisma.product.createMany({
    data: products,
  });

  console.log(`Seeded ${NUM_USERS} users and ${NUM_PRODUCTS} products.`);
  console.log(`Admin login: admin@admin.us / password`);
  console.log(`All other users: <their email> / ${DEFAULT_PASSWORD}`);
}

main()
.catch((e) => {
  console.error(e);
  process.exit(1);
})
.finally(async () => {
  await prisma.$disconnect();
});