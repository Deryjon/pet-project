<script setup lang="ts">
import { useRouter } from "vue-router"
import { useCatalogDataTableStore } from "@/store/catalogDataTableStore"

const store = useCatalogDataTableStore()
const router = useRouter()

// глобальный фильтр берём из стора
const globalFilter = store.globalFilter
const showFilters = ref(false)

function goToActions() {
  if (store.selectedProducts.length === 0) {
    alert("Выберите хотя бы один товар")
    return
  }

  router.push({
    path: "/products/settings",
    query: { ids: store.selectedProducts.join(",") },
  })
}

function goToCreate() {
  console.log("Создать новый продукт")
}
</script>

<template>
  <div class="top flex justify-between gap-[10px]">
    <!-- Поиск -->
    <div
      class="input pl-[17px] w-full bg-[#404040] rounded-[15px] flex items-center gap-[10px] hover:bg-[#5e5e5e] transition-colors duration-300"
    >
      <Icon name="material-symbols:search" class="w-6 h-6 text-[#bdbdbd]" />
      <input
        v-model="globalFilter"
        type="text"
        placeholder="Артикул, баркод, наименование"
        class="bg-transparent w-full text-[#bdbdbd] text-[17px] font-bold"
      />
    </div>

    <!-- Фильтры -->
    <div class="filters">
      <button
        class="filter bg-[#404040] rounded-[20px] flex items-center gap-[10px] p-[17px] text-[17px] font-bold text-white hover:bg-[#5e5e5e] transition-colors duration-300"
        @click="showFilters = !showFilters"
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
    <div class="action">
      <button
        class="filter bg-[#404040] rounded-[15px] flex items-center gap-[10px] p-[17px] text-[17px] font-bold text-white hover:bg-[#5e5e5e] transition-colors duration-300"
        @click="goToActions"
      >
        <Icon
          name="heroicons:adjustments-horizontal"
          class="w-5 h-5 text-[#4993dd]"
        />
        Действия
      </button>
    </div>

    <!-- Создать -->
    <div class="action">
      <button
        class="filter bg-[#1f78ff] rounded-[15px] flex items-center gap-[15px] p-[17px] text-[17px] font-bold text-white"
        @click="goToCreate"
      >
        <Icon name="heroicons:plus" class="w-5 h-5" />
        Создать
      </button>
    </div>
  </div>

  <!-- Фильтры блок -->
  <TableFilter v-if="showFilters" />

</template>
