import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, destroySession } from '@/lib/session'

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
  // bcrypt.compare extracts the salt from the stored hash itself and does a
  // constant-time comparison, so the separate password_salt column isn't
  // actually needed here. Re-hashing manually and comparing with `===` (the
  // previous approach) leaks timing information about where the strings
  // first differ, which is a real (if narrow) side-channel.
  return bcrypt.compare(plainPassword, user.password)
}

export async function login(email: string, plainPassword: string) {
  const user = await getUserByEmail(email)
  if (!user || !(await verifyPassword(plainPassword, user))) {
    return null
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name, // adjust if your User model names this field differently
  })

  return user
}

export async function logout() {
  await destroySession()
}