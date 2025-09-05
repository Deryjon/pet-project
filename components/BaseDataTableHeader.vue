<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

interface ActionButton {
  label: string;
  icon?: string;
  color?: string;
  onClick: () => void;
}

interface StatFilter {
  key: string;
  label: string;
  count: number;
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
  statFilters?: StatFilter[]; // 👉 передаём фильтры снаружи
  activeFilter?: string; // 👉 выбранный фильтр
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "toggleFilters"): void;
  (e: "update:activeFilter", value: string): void;
}>();

// v-model для поиска
const searchInput = ref(props.modelValue ?? "");
watch(searchInput, (val) => emit("update:modelValue", val));

// активный фильтр
const activeFilter = ref(
  props.activeFilter ?? (props.statFilters?.[0]?.key || "")
);
watch(
  () => props.activeFilter,
  (val) => {
    if (val) activeFilter.value = val;
  }
);
function selectFilter(key: string) {
  activeFilter.value = key;
  emit("update:activeFilter", key);
}

const router = useRouter();
</script>

<template>
  <!-- Верхняя панель фильтров -->
  <div v-if="statFilters?.length" class="flex gap-3 mb-4">
    <button
      v-for="f in statFilters"
      :key="f.key"
      @click="selectFilter(f.key)"
      class="flex items-center gap-2 py-1 px-3 rounded-[20px] transition-colors duration-300 text-[#bdbdbd]"
      :class="[activeFilter === f.key ? 'bg-[#404040]' : '']"
    >
      <span
        class="min-w-[28px] h-[28px] flex items-center justify-center rounded-full text-[18px] font-semibold"
        >{{ f.label }}</span
      >
      <span
        class="min-w-[28px] h-[28px] flex items-center justify-center rounded-full text-[18px] font-semibold"
        :class="activeFilter === f.key ? '' : ''"
      >
        ({{ f.count }})
      </span>
    </button>
  </div>
  
  <!-- Основной топбар -->
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
