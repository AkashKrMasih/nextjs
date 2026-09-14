// scripts/reset-password.ts
import 'dotenv/config' // add this as the very first line
import {PrismaClient} from '@/app/generated/prisma/client';
import bcrypt from 'bcryptjs'
import {PrismaPg} from "@prisma/adapter-pg";

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});

const prisma = new PrismaClient({adapter})

async function main() {
  const [email, newPassword] = process.argv.slice(2)

  if (!email || !newPassword) {
    console.error('Usage: npx tsx scripts/reset-password.ts <email> <newPassword>')
    process.exit(1)
  }

  const saltRounds     = 10
  const passwordSalt   = await bcrypt.genSalt(saltRounds)
  const hashedPassword = await bcrypt.hash(newPassword, passwordSalt)

  const user = await prisma.user.update({
    where: {email},
    data:  {
      password:      hashedPassword,
      password_salt: passwordSalt,
    },
  })

  console.log(`Password updated for ${user.email}`)
}

main()
.catch((err) => {
  console.error(err)
  process.exit(1)
})
.finally(() => prisma.$disconnect())