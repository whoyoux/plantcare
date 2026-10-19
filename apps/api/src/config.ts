/**
 * Google web OAuth client ID: the audience of ID tokens from native Google Sign-In (iOS and Android).
 * A public identifier (not a secret).
 */
export const GOOGLE_WEB_CLIENT_ID = '310586722263-as5g7dcle9hqtphaa3aphjng70m5qmd8.apps.googleusercontent.com';

/**
 * Per-stage identity: which app builds may sign in, which deep-link schemes Better Auth trusts and
 * which Google OAuth clients (web + one iOS client per bundle ID; public ids) may issue ID tokens.
 */
const STAGES = {
  prod: {
    bundleIds: ['dev.whxx.plantcare'],
    schemes: ['plantcare://'],
    googleClientIds: [GOOGLE_WEB_CLIENT_ID, '310586722263-0sng933js9sp11cafohfgd9gvv2q24hf.apps.googleusercontent.com'],
  },
  // The dev backend serves both the development client and the preview (TestFlight) build.
  dev: {
    bundleIds: ['dev.whxx.plantcare.dev', 'dev.whxx.plantcare.preview'],
    schemes: ['plantcare-dev://', 'plantcare-preview://'],
    googleClientIds: [
      GOOGLE_WEB_CLIENT_ID,
      '310586722263-8msb04d7gie51dgga949qjm0rddii8p7.apps.googleusercontent.com',
      '310586722263-85du90phsvh58libdvrrorl28lfupj6v.apps.googleusercontent.com',
    ],
  },
} as const;

export type StageConfig = (typeof STAGES)[keyof typeof STAGES];

export function stageConfig(stage: string): StageConfig {
  return stage === 'prod' ? STAGES.prod : STAGES.dev;
}

/**
 * Vision model for /v1/identify, chosen with tools/ai-eval (accuracy, latency, cost).
 * Requests go straight to OpenRouter.
 */
export const IDENTIFY_MODEL = { model: 'google/gemini-3.8-flash', effort: 'low' } as const;

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1';

/** Identifications per user in a rolling 24 hours. */
export const DAILY_IDENTIFICATIONS = 30;
