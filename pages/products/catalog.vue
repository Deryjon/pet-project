<template>
  <section class="catalog">
    <div class="top flex justify-between">
      <h2 class="text-[36px] font-bold text-white">Каталог</h2>
      <div
        class="stats flex items-center gap-[10px] text-white cursor-pointer"
        @click="showStats = !showStats"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          data-prefix="fas"
          data-icon="chevron-down"
          class="w-[14px] transition-transform duration-200"
          :class="{ 'rotate-180': showStats }"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
        >
          <path
            fill="currentColor"
            d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
          ></path>
        </svg>
        <p>{{ showStats ? "Скрыть статистику" : "Показать статистику" }}</p>
      </div>
    </div>

    <transition name="fade" v-if="showStats">
      <div class="grid grid-cols-4 gap-[20px]">
        <StatsBox label="Наименований" value="851 шт" />
        <StatsBox label="Товарных единиц" value="7 926 ед." />
        <StatsBox label="Сумма по цене поставки" value="73 035 912 UZS" />
        <StatsBox label="Сумма по цене продажи" value="449 603 000 UZS" />
      </div>
    </transition>

    <DataTable class="mt-[40px]" />
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import DataTable from "../../components/DataTable.vue";
import StatsBox from "../..//components/ui/StatsBox.vue";
import { useHead } from "#imports";

const showStats = ref(false);

useHead({
  title: "Каталог | Konkurent.cases",
  meta: [{ name: "description", content: "Описание страницы" }],
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
