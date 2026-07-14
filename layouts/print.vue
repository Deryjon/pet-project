<template>
  <div class="print-layout">
    <slot />
  </div>
</template>

<style>
.print-layout {
  background: #fff;
  color: #000;
  min-height: 100vh;
}

@media print {
  html,
  body {
    margin: 0;
    padding: 0;
  }
}
</style>
