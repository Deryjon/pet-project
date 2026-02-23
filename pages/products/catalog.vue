<template>
  <section class="catalog">
    <div class="top flex justify-between">
      <h2 class="text-[36px] font-bold text-white">Каталог</h2>
      <div class="flex items-center gap-4">
        <div
          class="flex cursor-pointer items-center gap-[10px] text-[#b5b4b4]"
          @click="showStats = !showStats"
        >
          <Icon
            name="tabler:chevron-down"
            class="w-5 h-5 text-muted-foreground transition-transform duration-200"
            :class="{ 'rotate-180': showStats }"
          />
          <p class="text-[17px] font-normal">
            {{ showStats ? "Скрыть статистику" : "Показать статистику" }}
          </p>
        </div>

        <div class="buttons flex items-center justify-between gap-2">
          <UTooltip text="Архивированные продукты" >
            <UButton
              color="neutral"
              variant="ghost"
              class="flex h-[56px] w-[56px] items-center justify-center cursor-pointer rounded-[15px] bg-[#404040] hover:bg-[#505050] active:bg-[#505050] focus-visible:ring-0"
            >
              <Icon name="bi:archive-fill" class="h-4 w-4 text-[#3b82f6]" />
            </UButton>
          </UTooltip>
          <UTooltip text="Управление каталогом">
            <UButton
              color="neutral"
              variant="ghost"
              class="flex h-[56px] w-[56px] items-center justify-center cursor-pointer rounded-[15px] bg-[#404040] hover:bg-[#505050] active:bg-[#505050] focus-visible:ring-0"
            >
              <Icon name="oui:nav-manage" class="h-5 w-5 text-[#3b82f6]" />
            </UButton>
          </UTooltip>
        </div>
      </div>
    </div>
    <transition name="fade">
      <div v-if="showStats" class="grid grid-cols-4 gap-[20px] mt-[10px]">
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
import { useHead } from "#imports";
import DataTable from "@/components/DataTable.vue";
import StatsBox from "@/components/ui/StatsBox.vue";

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
