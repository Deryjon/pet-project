<template>
    <div class="w-full">
      <!-- Label -->
      <label v-if="label" class="block text-[16px] mb-2 text-white font-bold">
        {{ label }}
      </label>
  
      <!-- Поле ввода -->
      <div class="relative">
        <input
          v-model="searchQuery"
          @focus="isOpen = true"
          @blur="closeDropdown"
          type="text"
          :placeholder="placeholder"
          class="w-full bg-[#404040] text-white rounded-[15px] p-[15px] outline-none focus:ring-2 focus:ring-[#4993dd]"
        />
  
        <!-- Выпадающий список -->
        <transition name="fade">
          <ul
            v-if="isOpen && filteredOptions.length > 0"
            class="absolute left-0 mt-1 w-full bg-[#2e2e2e] rounded-xl shadow-md overflow-hidden z-10 max-h-48 overflow-y-auto"
          >
            <li
              v-for="option in filteredOptions"
              :key="option.value"
              @mousedown.prevent="selectOption(option)"
              class="px-4 py-2 hover:bg-[#505050] cursor-pointer text-white"
            >
              {{ option.label }}
            </li>
          </ul>
        </transition>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from "vue";
  
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
  
  const emit = defineEmits(["update:modelValue"]);
  
  function normalizeOption(option: string | SelectOption): SelectOption {
    return typeof option === "string" ? { label: option, value: option } : option;
  }

  const normalizedOptions = computed(() => props.options.map(normalizeOption));
  const searchQuery = ref("");
  const isOpen = ref(false);

  function syncSearchQuery(value?: string) {
    const selected = normalizedOptions.value.find((option) => option.value === (value || ""));
    searchQuery.value = selected?.label || value || "";
  }

  watch(
    () => props.modelValue,
    (val) => {
      syncSearchQuery(val);
    },
    { immediate: true },
  );
  
  const filteredOptions = computed(() => {
    if (!searchQuery.value) return normalizedOptions.value;
    return normalizedOptions.value.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.value.toLowerCase()),
    );
  });
  
  const selectOption = (option: SelectOption) => {
    searchQuery.value = option.label;
    emit("update:modelValue", option.value);
    isOpen.value = false;
  };
  
  const closeDropdown = () => {
    setTimeout(() => {
      isOpen.value = false;
    }, 150);
  };
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
