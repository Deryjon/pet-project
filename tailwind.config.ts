import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  // Increase utility specificity inside Nuxt root to avoid frequent !important usage.
  important: '#__nuxt',
}
