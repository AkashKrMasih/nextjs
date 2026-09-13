import { createUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const user = await createUser(email, password)
  return NextResponse.json(user)
}