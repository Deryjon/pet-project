<script setup lang="ts">
withDefaults(defineProps<{ downloading?: boolean }>(), { downloading: false });
const emit = defineEmits<{ print: []; send: []; download: [] }>();

function onPrint() {
  emit("print");
  if (import.meta.client) window.print();
}
</script>

<template>
  <div class="rv-actions no-print">
    <button type="button" class="rv-btn rv-btn-primary" @click="onPrint">Печать</button>
    <button type="button" class="rv-btn" @click="emit('send')">Отправить</button>
    <button type="button" class="rv-btn" :disabled="downloading" @click="emit('download')">
      {{ downloading ? "Готовим PDF…" : "Скачать" }}
    </button>
  </div>
</template>

<style scoped>
.rv-actions { display: flex; gap: 8px; margin-top: 12px; }
.rv-btn {
  flex: 1;
  min-height: 40px;
  border-radius: 12px;
  background: #2a2a2a;
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}
.rv-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.rv-btn-primary { background: #1f78ff; }
</style>
