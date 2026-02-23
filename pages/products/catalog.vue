<template>
  <section class="catalog">
    <div class="top flex justify-between">
      <h2 class="text-[36px] font-bold text-white">Каталог</h2>
      <div class="flex items-center gap-4">
        <div
          class="flex cursor-pointer items-center gap-[10px] text-[#b5b4b4]"
          @click="toggleStats"
        >
          <Icon
            name="tabler:chevron-down"
            class="w-5 h-5 text-muted-foreground transition-transform duration-200"
            :class="{ 'rotate-180': showStats }"
          />
          <p class="text-[17px] font-normal">
            {{ statsToggleLabel }}
          </p>
        </div>

        <div class="buttons flex items-center justify-between gap-2">
          <UTooltip
            v-for="action in actions"
            :key="action.tooltip"
            :text="action.tooltip"
          >
            <UButton
              color="neutral"
              variant="ghost"
              :class="actionButtonClass"
              :aria-label="action.tooltip"
              :title="action.tooltip"
            >
              <Icon :name="action.icon" :class="action.iconClass" />
            </UButton>
          </UTooltip>
        </div>
      </div>
    </div>
    <transition name="fade">
      <div v-if="showStats" class="grid grid-cols-4 gap-[20px] mt-[10px]">
        <StatsBox
          v-for="item in statsItems"
          :key="item.label"
          :label="item.label"
          :value="item.value"
        />
      </div>
    </transition>

    <DataTable class="mt-[40px]" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useHead } from "#imports";
import DataTable from "@/components/DataTable.vue";
import StatsBox from "@/components/ui/StatsBox.vue";

const showStats = ref(false);
const statsItems = [
  { label: "Наименований", value: "851 шт" },
  { label: "Товарных единиц", value: "7 926 ед." },
  { label: "Сумма по цене поставки", value: "73 035 912 UZS" },
  { label: "Сумма по цене продажи", value: "449 603 000 UZS" },
];

const actions = [
  {
    tooltip: "Архивированные продукты",
    icon: "bi:archive-fill",
    iconClass: "h-4 w-4 text-[#3b82f6]",
  },
  {
    tooltip: "Управление каталогом",
    icon: "oui:nav-manage",
    iconClass: "h-5 w-5 text-[#3b82f6]",
  },
];

const actionButtonClass =
  "flex h-[56px] w-[56px] items-center justify-center cursor-pointer rounded-[15px] bg-[#404040] hover:bg-[#505050] active:bg-[#505050] focus-visible:ring-0";

const statsToggleLabel = computed(() =>
  showStats.value ? "Скрыть статистику" : "Показать статистику"
);

function toggleStats() {
  showStats.value = !showStats.value;
}

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
