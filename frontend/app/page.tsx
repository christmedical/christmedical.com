import { redirect } from "next/navigation";

/** Tenant subdomains rewrite `/` to `/queue` in middleware; apex falls through to marketing. */
export default function Home() {
  redirect("/queue");
}
