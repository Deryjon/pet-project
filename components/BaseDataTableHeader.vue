<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
  filtersOpen?: boolean;
  filtersSlot?: boolean;
  actionButtons?: ActionButton[];
  createButton?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
  statFilters?: StatFilter[];
  activeFilter?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "toggleFilters"): void;
  (e: "update:activeFilter", value: string): void;
}>();

const router = useRouter();

const searchInput = computed({
  get: () => props.modelValue ?? "",
  set: (value: string) => emit("update:modelValue", value),
});

const selectedFilterKey = computed({
  get: () => props.activeFilter ?? props.statFilters?.[0]?.key ?? "",
  set: (key: string) => emit("update:activeFilter", key),
});

const resolvedSearchPlaceholder = computed(
  () => props.searchPlaceholder || "Поиск..."
);

const isFiltersOpen = ref(!!props.filtersOpen);

watch(
  () => props.filtersOpen,
  (value) => {
    if (typeof value === "boolean") {
      isFiltersOpen.value = value;
    }
  }
);

function selectFilter(key: string) {
  selectedFilterKey.value = key;
}

function onToggleFilters() {
  isFiltersOpen.value = !isFiltersOpen.value;
  emit("toggleFilters");
}

function onCreateClick() {
  if (!props.createButton) return;
  if (props.createButton.onClick) {
    props.createButton.onClick();
    return;
  }
  if (props.createButton.to) {
    router.push(props.createButton.to);
  }
}
</script>

<template>
  <div v-if="statFilters?.length" class="mb-6 flex gap-1">
    <UButton
      v-for="f in statFilters"
      :key="f.key"
      color="neutral"
      variant="ghost"
      @click="selectFilter(f.key)"
      class="text-[18px] font-extralight flex items-center rounded-[20px] px-3 py-1 text-[#bdbdbd] transition-colors duration-300 cursor-pointer hover:bg-[#505050] active:bg-[#505050] data-[state=open]:bg-[#505050] focus-visible:ring-0"
      :class="[
        selectedFilterKey === f.key ? 'bg-[#404040] text-white' : 'text-[#bdbdbd]',
      ]"
    >
      <span>{{ f.label }}</span>
      <span>({{ f.count }})</span>
    </UButton>
  </div>

  <div class="top flex justify-between gap-[10px]">
    <div
      v-if="showSearch"
      class="group flex w-full items-center gap-[10px] rounded-[15px] border-3 border-transparent bg-[#404040] pl-[17px] transition-colors duration-300 hover:bg-[#5e5e5e] focus-within:border-[#4993dd]"
    >
      <Icon name="heroicons:magnifying-glass-20-solid" class="h-4 w-4 text-[#bdbdbd]" />
      <UInput
        v-model="searchInput"
        :placeholder="resolvedSearchPlaceholder"
        class="w-full"
        :ui="{
          root: 'w-full',
          base: 'w-full border-0 bg-transparent text-[17px] font-bold text-[#bdbdbd] placeholder:text-[#bdbdbd] ring-0 outline-none focus:border-0 focus:ring-0 focus-visible:ring-0',
        }"
      />
    </div>

    <div v-if="showFilters" class="filters">
      <UButton
        color="neutral"
        variant="ghost"
        class="cursor-pointer w-full flex items-center gap-[15px] rounded-[15px] bg-[#404040] p-[17px] text-[17px] font-bold text-white transition-colors duration-300 hover:bg-[#5e5e5e] active:bg-[#5e5e5e] data-[state=open]:bg-[#5e5e5e] focus-visible:ring-0"
        @click="onToggleFilters"
        :aria-expanded="isFiltersOpen"
      >
        <Icon
          name="tabler:chevron-down"
          class="h-5 w-5 text-white transition-transform duration-200"
          :class="{ 'rotate-180': isFiltersOpen }"
        />
        <Icon name="iconoir:filter-solid" class="h-5 w-5 text-[#4993dd]" />
        Фильтры
      </UButton>
    </div>

    <div v-if="actionButtons?.length" class="flex gap-2">
      <UButton
        v-for="(btn, i) in actionButtons"
        :key="`${btn.label}-${i}`"
        color="neutral"
        variant="ghost"
        class="cursor-pointer filter flex items-center gap-[10px] rounded-[15px] p-[17px] text-[17px] font-bold text-white transition-colors duration-300 hover:bg-[#5e5e5e] active:bg-[#5e5e5e] data-[state=open]:bg-[#5e5e5e] focus-visible:ring-0"
        :class="[btn.color || 'bg-[#404040]']"
        @click="btn.onClick"
      >
              <Icon name="mynaui:box-solid" class="h-5 w-5 text-[#4993dd]" />

        {{ btn.label }}
      </UButton>
    </div>

    <div v-if="createButton" class="action">
      <UButton
        color="neutral"
        variant="ghost"
        class="cursor-pointer flex items-center justify-center gap-2 rounded-[15px] bg-[#1f78ff] p-[17px] text-[17px] font-bold text-white transition-colors duration-300 hover:bg-[#2a6ed9] active:bg-[#2a6ed9] data-[state=open]:bg-[#2a6ed9] focus-visible:ring-0"
        @click="onCreateClick"
      >
        <Icon name="qlementine-icons:plus-16" class="h-6 w-6 font-extrabold" />
        <span class="truncate">{{ createButton.label }}</span>
      </UButton>
    </div>
  </div>

  <slot name="filters" />
</template>
