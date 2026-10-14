/**
 * Prompt injection & input abuse detection patterns
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /disregard\s+(?:all\s+)?prior\s+prompts/i,
  /reveal\s+(?:the\s+)?system\s+prompt/i,
  /print\s+(?:your\s+)?initial\s+instructions/i,
  /output\s+(?:the\s+)?api\s*key/i,
  /give\s+me\s+your\s+api\s*key/i,
  /what\s+is\s+your\s+api\s*key/i,
  /act\s+as\s+dan\b/i,
  /jailbreak\s+mode/i,
  /developer\s+mode\s+enabled/i,
];

export interface SanitizationResult {
  isValid: boolean;
  sanitizedText: string;
  threatDetected?: string;
}

const MAX_PAYLOAD_CHARS = 8000;

/**
 * Validates and sanitizes incoming user bug reports before feeding to LLM
 */
export function sanitizeBugInput(rawText: string): SanitizationResult {
  if (!rawText || typeof rawText !== 'string') {
    return {
      isValid: false,
      sanitizedText: '',
      threatDetected: 'Missing or invalid payload format.',
    };
  }

  // 1. Length enforcement (DDoS / Memory exhaustion protection)
  if (rawText.length > MAX_PAYLOAD_CHARS) {
    return {
      isValid: false,
      sanitizedText: '',
      threatDetected: `Payload exceeded maximum allowed length of ${MAX_PAYLOAD_CHARS} characters.`,
    };
  }

  // 2. Check for Prompt Injection / System Prompt Extraction
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(rawText)) {
      return {
        isValid: false,
        sanitizedText: '',
        threatDetected: 'Prompt injection signature detected. Bug reports must only describe software defects.',
      };
    }
  }

  // 3. Strip dangerous control characters (keep regular newlines, tabs, and printable chars)
  const sanitized = rawText
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .trim();

  return {
    isValid: true,
    sanitizedText: sanitized,
  };
}
