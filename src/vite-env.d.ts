/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public base URL of the live-scores blob container, e.g. https://<account>.blob.core.windows.net/scores. Unset = bundled data only. */
  readonly VITE_SCORES_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
