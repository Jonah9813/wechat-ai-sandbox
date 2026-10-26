/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GitHub 仓库（owner/repo），由 GitHub Actions 构建时注入，用于检查更新 */
  readonly VITE_GITHUB_REPO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
