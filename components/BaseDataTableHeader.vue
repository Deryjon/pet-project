<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

interface ActionButton {
  label: string;
  icon?: string;
  color?: string;
  onClick: () => void;
}

const props = defineProps<{
  searchPlaceholder?: string;
  modelValue?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  filtersSlot?: boolean;
  actionButtons?: ActionButton[];
  createButton?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "toggleFilters"): void;
}>();

// 👉 биндим к v-model, остальное не трогаем
const searchInput = ref(props.modelValue ?? "");
watch(searchInput, (val) => emit("update:modelValue", val));

const router = useRouter();
</script>

<template>
  <div class="top flex justify-between gap-[10px]">
    <!-- Поиск -->
    <div
      v-if="showSearch"
      class="pl-[17px] w-full bg-[#404040] rounded-[15px] flex items-center gap-[10px] hover:bg-[#5e5e5e] transition-colors duration-300"
    >
      <Icon name="material-symbols:search" class="w-6 text-[#bdbdbd]" />
      <input
        v-model="searchInput"
        type="text"
        :placeholder="searchPlaceholder || 'Поиск...'"
        class="bg-transparent w-full text-[#bdbdbd] text-[17px] font-bold"
      />
    </div>
    <!-- Фильтры -->
    <div v-if="showFilters" class="filters">
      <button
        class="filter bg-[#404040] rounded-[20px] flex items-center gap-[10px] p-[17px] text-[17px] font-bold text-white hover:bg-[#5e5e5e] transition-colors duration-300"
        @click="emit('toggleFilters')"
        :aria-expanded="showFilters"
      >
      <svg
          aria-hidden="true"
          focusable="false"
          data-prefix="fas"
          data-icon="chevron-down"
          class="w-[14px] transition-transform duration-200"
          :class="{ 'rotate-180': showFilters }"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
        >
          <path
            fill="currentColor"
            d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
          ></path>
        </svg>
        <Icon name="heroicons:funnel" class="w-5 h-5 text-[#4993dd]" />
        Фильтры
      </button>
    </div>

    <!-- Действия -->
    <div v-if="actionButtons?.length" class="flex gap-2">
      <button
        v-for="(btn, i) in actionButtons"
        :key="i"
        class="filter rounded-[15px] flex items-center gap-[10px] p-[17px] text-[17px] font-bold text-white hover:bg-[#5e5e5e] transition-colors duration-300"
        :class="[btn.color || 'bg-[#404040]']"
        @click="btn.onClick"
      >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#4993DD" xmlns="http://www.w3.org/2000/svg"><path d="M11.2031 0.328125L1.45312 3.98438C0.5625 4.3125 0 5.15625 0 6.09375V16.6406C0 17.4844 0.46875 18.2812 1.21875 18.6562L10.9688 23.5312C11.625 23.8594 12.3281 23.8594 12.9844 23.5312L22.7344 18.6562C23.4844 18.2812 23.9531 17.4844 23.9531 16.6406V6.09375C23.9531 5.15625 23.3906 4.3125 22.5 3.98438L12.75 0.328125C12.2812 0.140625 11.7188 0.140625 11.2031 0.328125ZM12 3.23438L21 6.60938V6.65625L12 10.3125L3 6.65625V6.60938L12 3.23438ZM13.5 19.9219V12.9375L21 9.89062V16.1719L13.5 19.9219Z" fill="inherit"></path></svg>
      {{ btn.label }}
      </button>
    </div>

    <!-- Создать -->
    <div v-if="createButton" class="action">
      <button
        class="w-[200px] bg-[#1f78ff] rounded-[15px] flex items-center justify-center gap-2 p-[17px] text-[17px] font-bold text-white hover:bg-[#2a6ed9] transition-colors duration-300"
        @click="
          createButton.onClick
            ? createButton.onClick()
            : createButton.to
            ? router.push(createButton.to)
            : null
        "
      >
        <Icon name="heroicons:plus" class="w-6 h-6 font-extrabold" />
        <span class="truncate">{{ createButton.label }}</span>
      </button>
    </div>
  </div>

  <!-- Слот для фильтров -->
  <slot name="filters" />
</template>
