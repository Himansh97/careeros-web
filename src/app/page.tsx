import { redirect } from "next/navigation";

// Marketing landing page is deferred (see build notes) — root goes straight
// into the product per current product direction.
export default function RootPage() {
  redirect("/dashboard");
}
