<script setup lang="ts">
import { useDashboardStore } from "@/store/dashboard";
const store = useDashboardStore();
</script>

<template>
  <div
    class="time-sales bg-[#404040] inline-flex gap-2 mb-4 p-1 rounded-[15px]"
  >
    <button
      v-for="period in store.periods"
      :key="period.value"
      @click="store.setPeriod(period.value)"
      :class="[ 
        'w-[120px] px-[16px] py-[10px] text-center rounded-[15px] font-semibold transition-colors',
        store.selectedPeriod === period.value
          ? 'bg-[#202020] text-white'
          : 'bg-[#404040] hover:bg-[#505050]',
      ]"
    >
      {{ period.label }}
    </button>
  </div>
</template>
