<script setup lang="ts">
import type { ReceiptSettingsData } from "@/composables/useReceipts";

defineProps<{ settings: ReceiptSettingsData }>();
</script>

<template>
  <div class="rv-header">
    <img v-if="settings.hasLogo && settings.logoUrl" :src="settings.logoUrl" alt="logo" class="rv-logo" />
    <div v-if="settings.hasBranchName && settings.branchName" class="rv-center rv-bold">{{ settings.branchName }}</div>
    <div v-if="settings.hasAddress && settings.address" class="rv-center rv-muted">{{ settings.address }}</div>
    <div v-if="settings.hasPhone && settings.phone" class="rv-center rv-muted">{{ settings.phone }}</div>
    <div v-if="settings.hasWorkingHours && settings.workingHours" class="rv-center rv-muted">{{ settings.workingHours }}</div>
    <div v-if="settings.hasWebsite && settings.website" class="rv-center rv-muted">{{ settings.website }}</div>
    <div v-if="settings.hasTaxId && settings.taxId" class="rv-row rv-muted">
      <span>ИНН:</span><span>{{ settings.taxId }}</span>
    </div>
  </div>
</template>

<style scoped>
.rv-header { display: grid; gap: 2px; }
.rv-logo { display: block; max-width: 80%; max-height: 60px; object-fit: contain; margin: 0 auto 4px; }
.rv-center { text-align: center; }
.rv-bold { font-weight: 700; }
.rv-muted { opacity: 0.75; }
.rv-row { display: flex; justify-content: space-between; gap: 8px; }
</style>
