<script lang="ts" setup>
import { computed } from "vue";
import BaseButton from "./ui/BaseButton.vue";
import { useLocationStore } from "@/store/useLocationStore";
import { storeToRefs } from "pinia";

const locationStore = useLocationStore();
const { locations, selectedLocation, isSwitching, switchError } = storeToRefs(locationStore);

const switchingLocationId = computed(() => {
  return isSwitching.value ? selectedLocation.value?.id ?? null : null;
});
</script>

<template>
  <div
    class="fixed top-0 left-0 z-[1100] h-full w-full max-w-[460px] overflow-y-auto rounded-r-[56px] bg-[#2b2b2b] px-8 py-14 text-white shadow-lg"
    @click.stop
  >
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-[32px] font-bold">Сменить магазин</h2>
      <button
        class="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#404040] hover:bg-[#5e5e5e]"
        @click="$emit('close')"
      >
        <Icon name="heroicons:arrow-left" class="h-4 w-4" />
      </button>
    </div>

    <div v-if="locations.length" class="space-y-4">
      <BaseButton
        v-for="location in locations"
        :key="location.id"
        class="w-full justify-center"
        :class="{
          'text-[#4993dd]': selectedLocation?.id === location.id,
          'text-white': selectedLocation?.id !== location.id,
          'pointer-events-none opacity-60': isSwitching,
        }"
        :disabled="isSwitching"
        @click="locationStore.setLocation(location)"
      >
        {{ switchingLocationId === location.id ? "Сохраняем..." : location.name }}
        <Icon
          v-if="!isSwitching && selectedLocation?.id === location.id"
          name="heroicons:check"
          class="ml-2 h-6 w-6"
        />
      </BaseButton>
    </div>

    <p v-if="switchError" class="mt-4 rounded-[20px] bg-[#4a2f2f] px-5 py-4 text-[#ffd7d7]">
      {{ switchError }}
    </p>

    <p v-else-if="!locations.length" class="rounded-[20px] bg-[#404040] px-5 py-4 text-[#bdbdbd]">
      Для пользователя не найдено доступных магазинов.
    </p>
  </div>
</template>
