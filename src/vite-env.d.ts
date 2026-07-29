/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_GOOGLE_WEB_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace google.accounts.id {
  interface CredentialResponse {
    credential: string;
    select_by?: string;
  }
  interface IdConfiguration {
    client_id: string;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: string;
    callback: (response: CredentialResponse) => void;
    native_callback?: (response: CredentialResponse) => void;
    nonce?: string;
    prompt_parent_id?: string;
    state_cookie_domain?: string;
    ux_mode?: 'popup' | 'redirect';
    allowed_parent_origin?: string | string[];
    intermediate_iframe_close_callback?: () => void;
  }
  interface GsiButtonConfiguration {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: number;
    locale?: string;
  }
  function initialize(config: IdConfiguration): void;
  function prompt(momentListener?: (moment: string) => void): void;
  function renderButton(parent: HTMLElement, options: GsiButtonConfiguration): void;
  function disableAutoSelect(): void;
  function storeCredential(credential: string, callback: () => void): void;
  function cancel(): void;
  function revoke(credential: string, callback?: () => void): void;
}

declare interface Window {
  google?: {
    accounts: typeof google.accounts.id;
  };
}
