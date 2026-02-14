export const getSafeDisplayName = (email?: string | null) => {
  if (!email) {
    return "Anonymous";
  }

  const localPart = email.split("@")[0] ?? "";
  const safeLocalPart = localPart.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);

  return safeLocalPart.length > 0 ? safeLocalPart : "Anonymous";
};
