<template>
  <div class="w-full">
    <label v-if="label" class="mb-2 block text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">
      {{ label }}
    </label>

    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="w-full rounded-[18px] border border-white/8 bg-[#323232] px-4 py-4 pr-11 text-[15px] text-white outline-none transition placeholder:text-[#757575] focus:border-[#4993dd] focus:bg-[#373737]"
        @focus="isOpen = true"
        @blur="closeDropdown"
      />

      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#7c7c7c]">
        <Icon name="heroicons:chevron-down-20-solid" class="h-5 w-5" />
      </div>

      <transition name="fade">
        <ul
          v-if="isOpen && filteredOptions.length > 0"
          class="absolute left-0 z-10 mt-2 max-h-56 w-full overflow-y-auto rounded-[18px] border border-white/8 bg-[#2a2a2a] p-2 shadow-[0_22px_50px_rgba(0,0,0,0.3)]"
        >
          <li
            v-for="option in filteredOptions"
            :key="option.value"
            class="cursor-pointer rounded-[14px] px-4 py-3 text-[14px] text-white transition hover:bg-[#3a3a3a]"
            @mousedown.prevent="selectOption(option)"
          >
            {{ option.label }}
          </li>
        </ul>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

interface SelectOption {
  label: string;
  value: string;
}

const props = defineProps<{
  label?: string;
  options: Array<string | SelectOption>;
  placeholder?: string;
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const searchQuery = ref("");
const isOpen = ref(false);

function normalizeOption(option: string | SelectOption): SelectOption {
  return typeof option === "string" ? { label: option, value: option } : option;
}

const normalizedOptions = computed(() => props.options.map(normalizeOption));

function syncSearchQuery(value?: string) {
  const selected = normalizedOptions.value.find((option) => option.value === (value || ""));
  searchQuery.value = selected?.label || value || "";
}

watch(
  () => props.modelValue,
  (value) => {
    syncSearchQuery(value);
  },
  { immediate: true },
);

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return normalizedOptions.value;
  }

  return normalizedOptions.value.filter((option) =>
    option.label.toLowerCase().includes(query),
  );
});

function selectOption(option: SelectOption) {
  searchQuery.value = option.label;
  emit("update:modelValue", option.value);
  isOpen.value = false;
}

function closeDropdown() {
  setTimeout(() => {
    isOpen.value = false;
    syncSearchQuery(props.modelValue);
  }, 120);
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
