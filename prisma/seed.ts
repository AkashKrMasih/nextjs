import "dotenv/config";
import {faker} from "@faker-js/faker";

import { prisma } from "@/lib/prisma";

const NUM_USERS    = 20;
const NUM_PRODUCTS = 150;

async function main() {
  console.log("Seeding database...");

  // --- Users ---
  // NOTE: these are fake placeholder values, not real hashes.
  // If you need users that can actually log in, hash a real
  // password with bcrypt here instead.
  const adminUser = {
    email:         "admin@admin.us",
    name:          "Admin",
    role:          "ADMIN",
    password:      "password",
    password_salt: faker.string.alphanumeric(16),
  };

  const fakeUsers = Array.from({length: NUM_USERS - 1}).map(() => ({
    email:         faker.internet.email().toLowerCase(),
    name:          faker.person.fullName(),
    role:          "CUSTOMER",
    password:      faker.string.alphanumeric(60),
    password_salt: faker.string.alphanumeric(16),
  }));

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
}

main()
.catch((e) => {
  console.error(e);
  process.exit(1);
})
.finally(async () => {
  await prisma.$disconnect();
});