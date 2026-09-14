import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function createUser(email: string, plainPassword: string) {
  const saltRounds = 10
  const passwordSalt = await bcrypt.genSalt(saltRounds)
  const hashedPassword = await bcrypt.hash(plainPassword, passwordSalt)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      password_salt: passwordSalt,
    },
  })

  return user
}

export async function getUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  return user
}

export async function verifyPassword(plainPassword: string, user: { password: string; password_salt: string }) {
  // Re-hash the submitted password with the user's stored salt, then
  // compare against the stored hash. bcrypt.hash is deterministic for a
  // given (password, salt) pair, so this is equivalent to bcrypt.compare
  // but makes use of the password_salt column explicitly.
  const rehashed = await bcrypt.hash(plainPassword, user.password_salt)
  return rehashed === user.password
}