import {
  OFFICIAL_ATO_MANIFESTS,
  REQUIRED_OFFICIAL_ATO_MANIFEST_IDS,
} from "../packages/shared-core/src/manifests/officialAto";
import type { AtoManifest } from "../packages/shared-core/src/types/ato";

const MANIFEST_PATH_LABEL = "packages/shared-core/src/manifests/officialAto.ts";

const validateStringField = (
  manifest: AtoManifest,
  key: keyof Pick<AtoManifest, "id" | "displayName" | "slashPath">,
  errors: string[]
) => {
  const value = manifest[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`Manifest has invalid ${key}: '${String(value)}'.`);
  }
};

const validateManifest = (manifest: AtoManifest, errors: string[]) => {
  validateStringField(manifest, "id", errors);
  validateStringField(manifest, "displayName", errors);
  validateStringField(manifest, "slashPath", errors);

  if (manifest.slashPath.trim() !== manifest.slashPath) {
    errors.push(`Manifest '${manifest.id}' has leading/trailing spaces in slashPath.`);
  }

  if (manifest.slashPath.startsWith("/") || manifest.slashPath.endsWith("/")) {
    errors.push(
      `Manifest '${manifest.id}' slashPath should not start or end with '/': '${manifest.slashPath}'.`
    );
  }

  if (manifest.slashPath.includes("//")) {
    errors.push(
      `Manifest '${manifest.id}' slashPath should not contain repeated '/': '${manifest.slashPath}'.`
    );
  }

  if (!Array.isArray(manifest.permissions) || manifest.permissions.length === 0) {
    errors.push(`Manifest '${manifest.id}' must define at least one permission.`);
  }

  if (manifest.entitlementRequirements === "founders" && manifest.status === "deprecated") {
    errors.push(
      `Manifest '${manifest.id}' cannot be founders-only while marked as deprecated.`
    );
  }
};

const validateUnique = (manifests: AtoManifest[], errors: string[]) => {
  const ids = new Set<string>();
  const slashPaths = new Set<string>();

  for (const manifest of manifests) {
    if (ids.has(manifest.id)) {
      errors.push(`Duplicate manifest id '${manifest.id}'.`);
    }
    ids.add(manifest.id);

    if (slashPaths.has(manifest.slashPath)) {
      errors.push(`Duplicate manifest slashPath '${manifest.slashPath}'.`);
    }
    slashPaths.add(manifest.slashPath);

    const parentPath = manifest.slashPath.includes("/")
      ? manifest.slashPath.split("/").slice(0, -1).join("/")
      : null;

    if (parentPath && !slashPaths.has(parentPath) && !manifests.some((entry) => entry.slashPath === parentPath)) {
      errors.push(
        `Manifest '${manifest.id}' references missing parent path '${parentPath}'.`
      );
    }
  }
};

const validateRequiredEntries = (manifests: AtoManifest[], errors: string[]) => {
  for (const requiredId of REQUIRED_OFFICIAL_ATO_MANIFEST_IDS) {
    if (!manifests.some((manifest) => manifest.id === requiredId)) {
      errors.push(`Missing required manifest id '${requiredId}'.`);
    }
  }
};

const run = () => {
  const errors: string[] = [];

  OFFICIAL_ATO_MANIFESTS.forEach((manifest) => validateManifest(manifest, errors));
  validateUnique(OFFICIAL_ATO_MANIFESTS, errors);
  validateRequiredEntries(OFFICIAL_ATO_MANIFESTS, errors);

  if (errors.length > 0) {
    console.error(`ATO manifest validation failed for ${MANIFEST_PATH_LABEL}.`);
    errors.forEach((error) => console.error(` - ${error}`));
    process.exit(1);
  }

  console.log(
    `ATO manifest validation passed (${OFFICIAL_ATO_MANIFESTS.length} manifests).`
  );
};

run();
