<script lang="ts" setup>
import BaseButton from "./ui/BaseButton.vue";
import { useLocationStore } from "@/store/useLocationStore";
import { storeToRefs } from "pinia";

const locationStore = useLocationStore();
const { locations, selectedLocation } = storeToRefs(locationStore);
</script>

<template>
  <div
    class="fixed top-0 left-0 h-full w-full max-w-[460px] bg-[#2b2b2b] text-white shadow-lg px-8 py-14 rounded-r-[56px] z-[60] overflow-y-auto"
    @click.stop
  >
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-[32px] font-bold">Сменить магазин</h2>
      <button
        @click="$emit('close')"
        class="rounded-full w-[48px] h-[48px] bg-[#404040] flex justify-center items-center hover:bg-[#5e5e5e]"
      >
        <Icon name="heroicons:arrow-left" class="w-4 h-4" />
      </button>
    </div>

    <div class="space-y-4">
      <BaseButton
        v-for="location in locations"
        :class="{
          'text-[#4993dd]': selectedLocation?.id === location.id,
          'text-white': selectedLocation?.id !== location.id,
        }"
        @click="locationStore.setLocation(location)"
        class="w-full justify-center"
      >
        {{ location.name }}
        <Icon
          v-if="locationStore.selectedLocation?.id === location.id"
          name="heroicons:check"
          class="w-6 h-6 ml-2"
        />
      </BaseButton>
    </div>
  </div>
</template>
