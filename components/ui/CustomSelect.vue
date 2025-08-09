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
              :key="option"
              @mousedown.prevent="selectOption(option)"
              class="px-4 py-2 hover:bg-[#505050] cursor-pointer text-white"
            >
              {{ option }}
            </li>
          </ul>
        </transition>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from "vue";
  
  const props = defineProps<{
    label?: string;
    options: string[];
    placeholder?: string;
    modelValue?: string;
  }>();
  
  const emit = defineEmits(["update:modelValue"]);
  
  const searchQuery = ref(props.modelValue || "");
  const isOpen = ref(false);
  
  watch(
    () => props.modelValue,
    (val) => {
      searchQuery.value = val || "";
    }
  );
  
  const filteredOptions = computed(() => {
    if (!searchQuery.value) return props.options;
    return props.options.filter(opt =>
      opt.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
  
  const selectOption = (option: string) => {
    searchQuery.value = option;
    emit("update:modelValue", option);
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