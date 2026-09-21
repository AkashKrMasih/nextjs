// lib/auth.ts

import bcrypt from 'bcryptjs'
import {prisma} from '@/lib/prisma'
import {getSession, destroySession} from '@/lib/session'

export async function auth() {
  const session = await getSession()
  if (!session) return null

  return {
    userId: session.userId,
    email:  session.email,
    name:   session.name,
    role:   session.role,
  }
}

export async function getCurrentUser(){
  return auth();
}

export async function createUser(email: string, plainPassword: string) {
  const saltRounds     = 10
  const passwordSalt   = await bcrypt.genSalt(saltRounds)
  const hashedPassword = await bcrypt.hash(plainPassword, passwordSalt)

  const user = await prisma.user.create({
    data: {
      email,
      password:      hashedPassword,
      password_salt: passwordSalt,
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