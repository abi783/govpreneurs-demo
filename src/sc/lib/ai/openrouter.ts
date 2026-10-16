// DEMO SHIM. Do not overwrite this file when you lift Success Center code.
// The real file calls the OpenRouter API from the server. The demo has no server and
// makes no outside call. `tellModel.ts` imports these two names; the demo never calls
// `completeChatViaOpenRouter` (the demo handler uses the pure `extract` reader), so
// it only has to exist and fail closed.

/** The real function sends the prompt to a model. The demo always refuses. */
export async function completeChatViaOpenRouter(_args: {
  systemPrompt: string;
  userText: string;
  model?: string;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<{ text: string }> {
  throw new Error("The demo makes no model calls.");
}

/** Extract the first JSON object from arbitrary model text. Same as the real one. */
export function parseJsonFromText<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}
