import { afterEach, describe, expect, it, vi } from 'vitest';

import * as apple from './apple';

type AppleModule = typeof apple;
import { revokeAppleAccess, type AppleTokensOptions } from './apple-tokens';

vi.mock('./apple', async (importOriginal) => ({
  ...(await importOriginal<AppleModule>()),
  revokeRefreshToken: vi.fn(),
  audienceOf: vi.fn(),
}));

const options: AppleTokensOptions = {
  key: { teamId: 'TEAM123', keyId: 'KEY123', privateKey: 'pem' },
  bundleIds: ['dev.whxx.plantcare', 'dev.whxx.plantcare.preview'],
};

afterEach(() => vi.clearAllMocks());

describe('revokeAppleAccess', () => {
  it('revokes the token for the bundle ID the user signed in with', async () => {
    vi.mocked(apple.audienceOf).mockReturnValue('dev.whxx.plantcare.preview');

    await revokeAppleAccess(options, [
      { providerId: 'google', refreshToken: 'google-token' },
      { providerId: 'apple', refreshToken: 'apple-token', idToken: 'id-token' },
    ]);

    expect(apple.audienceOf).toHaveBeenCalledWith('id-token');
    expect(apple.revokeRefreshToken).toHaveBeenCalledWith(options.key, 'dev.whxx.plantcare.preview', 'apple-token');
  });

  it('falls back to the first bundle ID when the ID token is missing', async () => {
    vi.mocked(apple.audienceOf).mockReturnValue(undefined);

    await revokeAppleAccess(options, [{ providerId: 'apple', refreshToken: 'apple-token' }]);

    expect(apple.revokeRefreshToken).toHaveBeenCalledWith(options.key, 'dev.whxx.plantcare', 'apple-token');
  });

  it('does nothing without a stored Apple token', async () => {
    await revokeAppleAccess(options, [{ providerId: 'google', refreshToken: 'google-token' }]);
    await revokeAppleAccess(options, [{ providerId: 'apple', refreshToken: null }]);

    expect(apple.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it('does nothing when the Apple key is not configured', async () => {
    await revokeAppleAccess({ ...options, key: { ...options.key, keyId: '' } }, [
      { providerId: 'apple', refreshToken: 'apple-token' },
    ]);

    expect(apple.revokeRefreshToken).not.toHaveBeenCalled();
  });
});
