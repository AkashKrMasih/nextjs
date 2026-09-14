'use server'

import { createUser, getUserByEmail } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

// Shape returned to useActionState/useFormState on the client.
export type AuthState = {
  error?: string
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

  try {
    const user = await createUser(email, password)
    await createSession(user.id)
  } catch (err) {
    return { error: 'Could not create account. Try a different email.' }
  }

  redirect('/dashboard')
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

  const user = await getUserByEmail(email)
  if (!user) {
    return { error: 'Invalid email or password' }
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    return { error: 'Invalid email or password' }
  }

  await createSession(user.id)
  redirect('/dashboard')
}

// Minimal session cookie helper. Swap for your real session/JWT logic.
async function createSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set('session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}
