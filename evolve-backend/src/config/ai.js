// Single source of truth for AI model selection and generation defaults.
// Swapping models means editing this file only — nothing else in the
// codebase should hardcode a model string.
export const aiConfig = {
  model: 'llama-3.3-70b-versatile',
  temperature: 0.8,
  maxTokens: 1024,
  // Threshold used by creditService to decide "normal" (1 credit) vs
  // "long" (2 credit) response cost, based on requested/likely output size.
  longResponseTokenThreshold: 600,
  streaming: true,
};
