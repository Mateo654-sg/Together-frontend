let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export const tokenStore = {
  get(): string | null {
    return _accessToken;
  },
  set(token: string | null): void {
    _accessToken = token;
  },
  getRefresh(): string | null {
    return _refreshToken;
  },
  setRefresh(token: string | null): void {
    _refreshToken = token;
  },
  clear(): void {
    _accessToken = null;
    _refreshToken = null;
  },
};
