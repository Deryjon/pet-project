<script setup lang="ts">
import type { ReceiptSettingsData } from "@/composables/useReceipts";

defineProps<{ settings: ReceiptSettingsData; showShopName: boolean; shopName: string }>();
</script>

<template>
  <div class="rv-header">
    <img v-if="settings.hasLogo && settings.logoUrl" :src="settings.logoUrl" alt="logo" class="rv-logo" />
    <div v-if="showShopName" class="rv-center rv-bold">{{ shopName }}</div>
    <img
      v-if="settings.hasAdditionalImage && settings.additionalImageUrl"
      :src="settings.additionalImageUrl"
      alt=""
      class="rv-additional-image"
    />
  </div>
</template>

<style scoped>
.rv-header { display: grid; gap: 2px; }
.rv-logo { display: block; max-width: 80%; max-height: 60px; object-fit: contain; margin: 0 auto 4px; }
.rv-additional-image { display: block; max-width: 100%; height: auto; object-fit: contain; margin: 4px auto 0; }
.rv-center { text-align: center; }
.rv-bold { font-weight: 700; }
</style>
