import { StrainLibrary } from "@/components/myflowerai/strain-library";
import { loadStrains } from "@/lib/myflowerai/strains/load-strains";

export default async function StrainLibraryPage() {
  const strains = await loadStrains();

  return <StrainLibrary strains={strains} />;
}
