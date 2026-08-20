// Single source of truth for AI model selection and generation defaults.
// Swapping models means editing this file only — nothing else in the
// codebase should hardcode a model string.
//
// NOTE: llama-3.3-70b-versatile was deprecated by Groq and fully
// decommissioned Aug 16, 2026 (see https://console.groq.com/docs/deprecations).
// Requests to it now 404 with code "model_not_found". Using Groq's
// recommended replacement below. If you swap again, check that page first —
// Groq has been retiring models on short notice throughout 2026.
export const aiConfig = {
  model: 'openai/gpt-oss-120b',
  temperature: 0.8,
  maxTokens: 1024,
  // Threshold used by creditService to decide "normal" (1 credit) vs
  // "long" (2 credit) response cost, based on requested/likely output size.
  longResponseTokenThreshold: 600,
  streaming: true,
};
