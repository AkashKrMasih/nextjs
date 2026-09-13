import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function createUser(email: string, plainPassword: string) {
  const saltRounds = 10
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  })

  return user
}