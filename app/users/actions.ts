// app/users/actions.ts

'use server'

import { createUser, getUserByEmail, verifyPassword } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createSession, destroySession } from '@/lib/session'
import bcrypt from "bcryptjs";

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

  redirect('/')
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

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
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

export async function logout() {
  await destroySession()
  redirect('/login')
}