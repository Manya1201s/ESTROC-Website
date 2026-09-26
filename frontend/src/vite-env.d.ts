/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** JSON POST target for project enquiries. Unset falls back to a mailto handoff. */
  readonly VITE_ENQUIRY_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
