// app/users/actions.ts

'use server'

import { createUser, getUserByEmail, hashPassword, verifyPassword } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createSession, destroySession } from '@/lib/session'
import { findPasswordResetToken, sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import bcrypt from "bcryptjs";

// Shape returned to useActionState/useFormState on the client.
export type AuthState = {
  error?: string
  success?: string
} | undefined

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const existing = await getUserByEmail(email)
  if (existing?.emailVerified) {
    return { error: 'Could not create account. Try a different email.' }
  }

  try {
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: await hashPassword(password),
        })
      : await createUser(email, password, { emailVerified: false })

    const sent = await sendVerificationEmail(user.id, user.email)
    if ('error' in sent) {
      if (!existing) {
        await prisma.user.delete({ where: { id: user.id } })
      }
      return { error: sent.error }
    }
  } catch (err) {
    console.error('Signup failed:', err)
    return { error: 'Could not create account. Try a different email.' }
  }

  return { success: `Check ${email} for a verification link before you log in.` }
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    const user = await getUserByEmail(email)
    if (!user) {
      return { error: 'Invalid email or password' }
    }

    console.log('hash:', user?.password, 'length:', user?.password.length)
    console.log('matches "password":', await bcrypt.compare(password, user!.password))

    const isValid = await verifyPassword(password, user)

    if (!isValid) {
      return { error: 'Invalid email or password' }
    }

    if (!user.emailVerified) {
      return { error: 'Verify your email before logging in. Check your inbox for the link.' }
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name ?? '',
      role: user.role
    })
  } catch (err) {
    // Log the real error server-side so it shows up in your terminal/logs.
    // Without this, any throw from getUserByEmail/verifyPassword/createSession
    // was an unhandled server action error — no state.error was ever set,
    // which is why the form appeared to do nothing.
    console.error('Login failed:', err)
    return { error: 'Something went wrong. Please try again.' }
  }

  redirect('/')
}

export async function requestPasswordReset(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'Email is required' }

  const sent = await sendPasswordResetEmail(email)
  if ('error' in sent) return { error: sent.error }

  return { success: 'If an account exists for that email, a reset link is on its way. It expires in 1 hour.' }
}

export async function resetPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  const record = await findPasswordResetToken(token)
  if (!record) {
    return { error: 'This reset link is invalid or has expired.' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { ...(await hashPassword(password)), emailVerified: true },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ])

  redirect('/login?reset=1')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}