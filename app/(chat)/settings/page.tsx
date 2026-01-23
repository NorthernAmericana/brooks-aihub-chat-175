import { redirect } from "next/navigation";

export default async function SettingsPage() {
  // Settings page is disabled - redirect to home
  redirect("/");
}
