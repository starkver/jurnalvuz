/// <reference types="vite/client" />

// Расширяем типы для Figma assets
declare module 'figma:asset/*' {
  const src: string
  export default src
}

// Расширяем типы для путей SVG
declare module '*/imports/*' {
  const paths: string[]
  export default paths
}

// Определяем переменные окружения
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // Добавьте больше переменных окружения здесь, если необходимо
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}