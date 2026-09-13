'use server'

import { createUser } from '@/lib/auth'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const user = await createUser(email, password)
  return user
}