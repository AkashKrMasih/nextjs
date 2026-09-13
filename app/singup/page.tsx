// app/signup/page.tsx
import { signup } from '@/app/actions/user'

export default function SignupPage() {
  return (
    <form action={signup}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign Up</button>
    </form>
  )
}