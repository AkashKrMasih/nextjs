// lib/auth.ts

import bcrypt from 'bcryptjs'
import {prisma} from '@/lib/prisma'
import {getSession, destroySession} from '@/lib/session'

export async function auth() {
  const session = await getSession()
  if (!session) return null

  return {
    id:     session.userId,
    userId: session.userId,
    email:  session.email,
    name:   session.name,
    role:   session.role,
  }
}

export async function getCurrentUser() {
  return auth();
}

export async function hashPassword(plainPassword: string) {
  const saltRounds = 10
  const passwordSalt = await bcrypt.genSalt(saltRounds)
  const hashedPassword = await bcrypt.hash(plainPassword, passwordSalt)
  return { password: hashedPassword, password_salt: passwordSalt }
}

export async function createUser(
  email: string,
  plainPassword: string,
  options?: { name?: string | null; role?: 'CUSTOMER' | 'ADMIN' }
) {
  const hashed = await hashPassword(plainPassword)

  const user = await prisma.user.create({
    data: {
      email,
      name: options?.name ?? null,
      role: options?.role ?? 'CUSTOMER',
      password: hashed.password,
      password_salt: hashed.password_salt,
    },
  })

  return user
}

export async function getUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {email},
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

export async function logout() {
  await destroySession()
}