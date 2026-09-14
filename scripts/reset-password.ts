// scripts/reset-password.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const [email, newPassword] = process.argv.slice(2)

  if (!email || !newPassword) {
    console.error('Usage: npx tsx scripts/reset-password.ts <email> <newPassword>')
    process.exit(1)
  }

  const saltRounds = 10
  const passwordSalt = await bcrypt.genSalt(saltRounds)
  const hashedPassword = await bcrypt.hash(newPassword, passwordSalt)

  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
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