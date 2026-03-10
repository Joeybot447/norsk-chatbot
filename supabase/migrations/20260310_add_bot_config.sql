-- Add bot_config JSONB column to sites table for AI response customization
ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS bot_config jsonb DEFAULT '{
  "system_prompt": "",
  "tone": "vennlig",
  "response_length": "medium",
  "temperature": 0.7,
  "include_sources": true,
  "fallback_message": "Beklager, jeg fant ikke svar på det. Kontakt oss direkte for hjelp.",
  "max_tokens": 500
}'::jsonb;

COMMENT ON COLUMN public.sites.bot_config IS 'AI chatbot response configuration: system prompt, tone, temperature, max tokens, etc.';
