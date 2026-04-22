<template>
  <div class="top flex flex-col gap-4 sm:gap-6" ref="dropdownRef">
    <div class="flex items-center justify-between gap-3">
      <label class="block text-[16px] font-semibold sm:text-[18px]">Клиент</label>
      <button class="text-[#4993dd]">Создать</button>
    </div>

    <div class="relative">
      <div class="flex items-center gap-2 rounded-[15px] bg-[#404040] p-3 sm:p-4">
        <span><svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8C9.1875 8 11 6.21875 11 4C11 1.8125 9.1875 0 7 0C4.78125 0 3 1.8125 3 4C3 6.21875 4.78125 8 7 8ZM9.78125 9H9.25C8.5625 9.34375 7.8125 9.5 7 9.5C6.1875 9.5 5.40625 9.34375 4.71875 9H4.1875C1.875 9 0 10.9062 0 13.2188V14.5C0 15.3438 0.65625 16 1.5 16H12.5C13.3125 16 14 15.3438 14 14.5V13.2188C14 10.9062 12.0938 9 9.78125 9Z" fill="#4993DD"></path></svg></span>
        <input
          type="text"
          v-model="search"
          placeholder="Имя или номер клиента"
          class="flex-1 bg-transparent text-[14px] text-white outline-none sm:text-base"
          @focus="isOpen = true"
        />
      </div>

      <transition name="fade">
        <ul
          v-if="isOpen && filteredClients.length"
          class="absolute left-0 right-0 z-10 mt-2 max-h-[200px] overflow-y-auto rounded-[15px] bg-[#2e2e2e] shadow-lg"
        >
          <li
            v-for="client in filteredClients"
            :key="client.id"
            @click="selectClient(client)"
            class="cursor-pointer rounded-[10px] px-4 py-3 hover:bg-[#4993dd] hover:text-white"
          >
            {{ client.name }} — {{ client.phone }}
          </li>
        </ul>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const isOpen = ref(false);
const search = ref("");
const selectedClient = ref<any>(null);

const clients = ref([
  { id: 1, name: "Иван Иванов", phone: "+998 90 123 45 67" },
  { id: 2, name: "Петр Петров", phone: "+998 91 765 43 21" },
  { id: 3, name: "Саша Сидоров", phone: "+998 93 111 22 33" },
]);

const filteredClients = computed(() => {
  if (!search.value) return clients.value;
  return clients.value.filter(
    (c) =>
      c.name.toLowerCase().includes(search.value.toLowerCase()) ||
      c.phone.includes(search.value)
  );
});

function selectClient(client: any) {
  selectedClient.value = client;
  search.value = client.name;
  isOpen.value = false;
}

const dropdownRef = ref<HTMLElement | null>(null);

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
