// Minimal client for Groq's OpenAI-compatible Chat Completions API.
// Works with any OpenAI-compatible provider by changing GROQ_BASE_URL and GROQ_MODEL.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function llmConfig() {
  return {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    baseUrl: (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
  };
}

export const isLLMConfigured = () => Boolean(process.env.GROQ_API_KEY);

/**
 * Sends a chat request and returns the parsed JSON object from the reply.
 * @param {object} opts
 * @param {string} opts.system  instructions for the model
 * @param {string} opts.user    the data to analyse
 * @param {object} [opts.schema] JSON Schema the answer must follow
 * @param {number} [opts.maxTokens]
 */
export async function chatJSON({ system, user, schema, maxTokens = 2000 }) {
  const { apiKey, model, baseUrl } = llmConfig();
  if (!apiKey) throw new Error('GROQ_API_KEY is not set in server/.env');

  const isGptOss = model.includes('gpt-oss');
  const body = {
    model,
    temperature: 0.3,
    max_completion_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    // gpt-oss models support strict JSON Schema (guaranteed shape); others get plain JSON mode
    response_format: schema && isGptOss
      ? { type: 'json_schema', json_schema: { name: 'result', strict: true, schema } }
      : { type: 'json_object' },
  };
  if (isGptOss) body.reasoning_effort = 'low'; // faster replies, fewer tokens

  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let res;
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000),
      });
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw new Error(`Could not reach the AI service: ${err.message}`);
      await sleep(1500 * attempt);
      continue;
    }

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      try {
        return { data: JSON.parse(content), model: data.model || model, usage: data.usage };
      } catch {
        throw new Error('The AI returned an answer that was not valid JSON.');
      }
    }

    const errBody = await res.json().catch(() => ({}));
    const message = errBody.error?.message || res.statusText;
    if (res.status === 401) throw new Error('GROQ_API_KEY is invalid. Create a new key at console.groq.com/keys.');
    if (res.status === 404) throw new Error(`Model "${model}" not found. Check GROQ_MODEL against console.groq.com/docs/models.`);

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) {
      throw new Error(res.status === 429 ? `AI rate limit reached: ${message}` : `AI request failed (${res.status}): ${message}`);
    }
    // Respect Groq's retry-after header (seconds), capped at 20s
    const wait = Math.min(Number(res.headers.get('retry-after')) || 2 * attempt, 20) * 1000;
    await sleep(wait);
  }
  throw new Error('AI request failed.');
}
