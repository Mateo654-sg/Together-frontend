let _accessToken: string | null = null;

export const tokenStore = {
  get(): string | null {
    return _accessToken;
  },
  set(token: string | null): void {
    _accessToken = token;
  },
  clear(): void {
    _accessToken = null;
  },
};
