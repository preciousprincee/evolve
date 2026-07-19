import Groq from 'groq-sdk';
import { env } from '../config/env.js';

export const groqClient = new Groq({ apiKey: env.GROQ_API_KEY });

/**
 * Streams a completion from Groq, invoking onToken(text) for each chunk and
 * resolving with the full accumulated text at the end (used for saving the
 * message and for the long-response credit check).
 *
 * Timeouts + retry: a single retry on transient network failure, and a hard
 * timeout so a hung upstream connection can't hold a request open forever.
 */
export async function streamCompletion({ model, temperature, maxTokens, messages, onToken, signal }) {
  const attempt = async () => {
    const stream = await groqClient.chat.completions.create(
      {
        model,
        temperature,
        max_tokens: maxTokens,
        messages,
        stream: true,
      },
      { signal }
    );

    let fullText = '';
    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || '';
      if (token) {
        fullText += token;
        onToken(token);
      }
    }
    return fullText;
  };

  try {
    return await attempt();
  } catch (err) {
    if (err.name === 'AbortError') throw err; // client disconnected — don't retry
    // One retry for transient upstream errors (network blip, 5xx).
    return await attempt();
  }
}
