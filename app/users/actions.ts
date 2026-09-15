// app/users/actions.ts

'use server'

import { createUser, getUserByEmail, verifyPassword } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createSession, destroySession } from '@/lib/session'

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
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name, // TODO: signup doesn't collect a name yet — add a `name` field to the form if you want this populated
    })
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

  const isValid = await verifyPassword(password, user)

  if (!isValid) {
    return { error: 'Invalid email or password' }
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
  })
  redirect('/')
}

export async function logout() {
  await destroySession()
  redirect('/login')
}