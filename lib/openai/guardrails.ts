type GuardrailsContext = {
  guardrailLlm?: unknown;
};

export async function runGuardrails(
  _input: string,
  _config: unknown,
  _context: GuardrailsContext,
  _includeRaw?: boolean
): Promise<any[]> {
  return [];
}
