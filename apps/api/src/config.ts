/**
 * Google web OAuth client ID: the audience of ID tokens from native Google Sign-In (iOS and Android).
 * A public identifier; empty until configured, which keeps Google sign-in disabled.
 */
export const GOOGLE_WEB_CLIENT_ID = '';

/** Per-stage identity: which app builds may sign in and which deep-link schemes Better Auth trusts. */
const STAGES = {
  prod: {
    bundleIds: ['dev.whxx.plantcare'],
    schemes: ['plantcare://'],
  },
  // The dev backend serves both the development client and the preview (TestFlight) build.
  dev: {
    bundleIds: ['dev.whxx.plantcare.dev', 'dev.whxx.plantcare.preview'],
    schemes: ['plantcare-dev://', 'plantcare-preview://'],
  },
} as const;

export type StageConfig = (typeof STAGES)[keyof typeof STAGES];

export function stageConfig(stage: string): StageConfig {
  return stage === 'prod' ? STAGES.prod : STAGES.dev;
}
