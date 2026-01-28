import manifest from "../app/manifest";

type ManifestIcon = {
  src?: string;
};

type ManifestLike = {
  start_url?: string;
  scope?: string;
  icons?: ManifestIcon[];
};

const errors: string[] = [];

const manifestData = manifest() as ManifestLike;
const rawManifest = JSON.stringify(manifestData);

if (rawManifest.includes("vercel.app")) {
  errors.push("Manifest JSON must not include 'vercel.app'.");
}

if (rawManifest.includes("http://") || rawManifest.includes("https://")) {
  errors.push("Manifest JSON must not include absolute http(s) URLs.");
}

if (!manifestData.start_url) {
  errors.push("Manifest start_url is missing.");
} else if (!manifestData.start_url.startsWith("/")) {
  errors.push("Manifest start_url must be a relative path starting with '/'.");
} else if (!["/", "/welcome"].includes(manifestData.start_url)) {
  errors.push("Manifest start_url must be '/' or '/welcome'.");
}

if (manifestData.scope !== "/") {
  errors.push("Manifest scope must be '/'.");
}

if (!Array.isArray(manifestData.icons) || manifestData.icons.length === 0) {
  errors.push("Manifest icons must be defined.");
} else {
  const invalidIcon = manifestData.icons.find((icon) =>
    icon.src ? !icon.src.startsWith("/") : true
  );

  if (invalidIcon) {
    errors.push(
      "Manifest icons must use relative src paths starting with '/'."
    );
  }
}

const baseUrl = process.env.PWA_CHECK_BASE_URL;

const run = async () => {
  if (baseUrl) {
    const welcomeUrl = new URL("/welcome", baseUrl);

    const firstResponse = await fetch(welcomeUrl, { redirect: "manual" });
    const isRedirect =
      firstResponse.status >= 300 && firstResponse.status < 400;

    if (isRedirect) {
      const location = firstResponse.headers.get("location");

      if (location) {
        const redirectUrl = new URL(location, welcomeUrl);
        const secondResponse = await fetch(redirectUrl, { redirect: "manual" });

        if (secondResponse.status >= 300 && secondResponse.status < 400) {
          errors.push("/welcome redirected more than once.");
        } else if (!secondResponse.ok) {
          errors.push(
            `/welcome redirect target returned ${secondResponse.status}.`
          );
        }
      } else {
        errors.push("/welcome redirect is missing a Location header.");
      }
    } else if (!firstResponse.ok) {
      errors.push(`/welcome returned ${firstResponse.status}.`);
    }
  } else {
    console.warn(
      "PWA_CHECK_BASE_URL not set; skipping live /welcome redirect check."
    );
  }

  if (errors.length > 0) {
    console.error("PWA installability checks failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("PWA installability checks passed.");
};

run();
