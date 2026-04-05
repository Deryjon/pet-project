<template>
  <section class="app-shell auth-shell flex items-center justify-center px-4 py-10">
    <div class="app-orb app-orb-1" aria-hidden="true"></div>
    <div class="app-orb app-orb-2" aria-hidden="true"></div>
    <div class="app-orb app-orb-3" aria-hidden="true"></div>
    <slot />
  </section>
</template>

<style scoped>
.auth-shell {
  background:
    radial-gradient(circle at 14% 18%, rgba(31, 120, 255, 0.18), transparent 32%),
    radial-gradient(circle at 82% 12%, rgba(31, 120, 255, 0.1), transparent 28%),
    linear-gradient(180deg, #0c1016 0%, #0a0d12 48%, #07090d 100%);
}
</style>