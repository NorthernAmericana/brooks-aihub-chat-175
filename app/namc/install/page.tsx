import { redirect } from "next/navigation";

const NAMC_PWA_URL = "https://www.northernamericana.media";

export default function NamcInstallPage() {
  redirect(NAMC_PWA_URL);
}
