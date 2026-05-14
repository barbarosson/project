import { redirect } from "next/navigation";

/** Guest merge flow removed — keep URL stable for old bookmarks. */
export default function ClaimPage() {
  redirect("/");
}
