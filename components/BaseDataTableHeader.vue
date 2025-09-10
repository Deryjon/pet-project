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
  <div v-if="statFilters?.length" class="flex gap-1 mb-4">
    <button
      v-for="f in statFilters"
      :key="f.key"
      @click="selectFilter(f.key)"
      class="flex items-center py-1 px-3 rounded-[20px] transition-colors duration-300 text-[#bdbdbd]"
      :class="[activeFilter === f.key ? 'bg-[#404040]' : '']"
    >
      <span
        class="min-w-[28px] h-[28px] flex items-center justify-center rounded-full text-[18px] font-semibold"
        >{{ f.label }}</span
      >
      <span
        class="min-w-[28px] h-[28px] flex items-center justify-center rounded-full text-[16px] font-semibold"
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
      <svg
        width="16"
        height="17"
        viewBox="0 0 16 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15.7812 13.8438L12.6562 10.7188C12.5 10.5938 12.3125 10.5 12.125 10.5H11.625C12.4688 9.40625 13 8.03125 13 6.5C13 2.9375 10.0625 0 6.5 0C2.90625 0 0 2.9375 0 6.5C0 10.0938 2.90625 13 6.5 13C8 13 9.375 12.5 10.5 11.625V12.1562C10.5 12.3438 10.5625 12.5312 10.7188 12.6875L13.8125 15.7812C14.125 16.0938 14.5938 16.0938 14.875 15.7812L15.75 14.9062C16.0625 14.625 16.0625 14.1562 15.7812 13.8438ZM6.5 10.5C4.28125 10.5 2.5 8.71875 2.5 6.5C2.5 4.3125 4.28125 2.5 6.5 2.5C8.6875 2.5 10.5 4.3125 10.5 6.5C10.5 8.71875 8.6875 10.5 6.5 10.5Z"
          fill="#BDBDBD"
        ></path>
      </svg>
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
        class="filter bg-[#404040] rounded-[15px] flex items-center gap-[10px] p-[17px] text-[17px] font-bold text-white hover:bg-[#5e5e5e] transition-colors duration-300"
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
        class="bg-[#1f78ff] rounded-[15px] flex items-center justify-center gap-2 p-[17px] text-[17px] font-bold text-white hover:bg-[#2a6ed9] transition-colors duration-300"
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
