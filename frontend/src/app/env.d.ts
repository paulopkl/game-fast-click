declare global {
  interface ImportMetaEnv {
    readonly API_URL: string;
    readonly LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'; // Union type for strict typing
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
