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
      >
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
        <Icon v-if="btn.icon" :name="btn.icon" class="w-5 h-5" />
        {{ btn.label }}
      </button>
    </div>

    <!-- Создать -->
    <div v-if="createButton" class="action">
      <button
        class="w-[200px] bg-[#1f78ff] rounded-[15px] flex items-center p-[17px] gap-[15px]  text-[17px]  font-bold text-white"
        @click="
          createButton.onClick
            ? createButton.onClick()
            : createButton.to
            ? router.push(createButton.to)
            : null
        "
      >
        <Icon name="heroicons:plus" class="w-5 h-5" />
        {{ createButton.label }}
      </button>
    </div>
  </div>

  <!-- Слот для фильтров -->
  <slot name="filters" />
</template>
