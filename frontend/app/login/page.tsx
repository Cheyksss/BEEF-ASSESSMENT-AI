import { redirect } from "next/navigation"

export default function LoginPage() {
  // Login disabled: redirect visitors directly to assessment
  redirect("/assess")
}
