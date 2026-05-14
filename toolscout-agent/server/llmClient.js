const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

function hasByokConfig() {
  return Boolean(process.env.BYOK_API_KEY);
}

export async function validateBringYourKey() {
  if (!hasByokConfig()) {
    return { configured: false, provider: LLM_BASE_URL, model: LLM_MODEL };
  }

  try {
    const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BYOK_API_KEY}`
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: 'user', content: 'Reply with: OK' }],
        max_tokens: 5,
        temperature: 0
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      return { configured: true, connected: false, provider: LLM_BASE_URL, model: LLM_MODEL, error: txt.slice(0, 200) };
    }

    return { configured: true, connected: true, provider: LLM_BASE_URL, model: LLM_MODEL };
  } catch (error) {
    return { configured: true, connected: false, provider: LLM_BASE_URL, model: LLM_MODEL, error: error.message };
  }
}

export function getModelConfig() {
  return {
    configured: hasByokConfig(),
    provider: LLM_BASE_URL,
    model: LLM_MODEL,
    keyPreview: hasByokConfig() ? `${process.env.BYOK_API_KEY.slice(0, 4)}...${process.env.BYOK_API_KEY.slice(-4)}` : null
  };
}
