<template>
  <section class="catalog">
    <div class="top flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <h2 class="text-[28px] font-bold text-white sm:text-[36px]">Каталог</h2>
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          class="flex cursor-pointer items-center gap-[10px] text-[#b5b4b4]"
          @click="toggleStats"
        >
          <Icon
            name="tabler:chevron-down"
            class="h-5 w-5 text-muted-foreground transition-transform duration-200"
            :class="{ 'rotate-180': showStats }"
          />
          <p class="text-[17px] font-normal">
            {{ statsToggleLabel }}
          </p>
        </div>

        <div class="buttons flex items-center gap-2">
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
      <div
        v-if="showStats"
        class="mt-[10px] grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-4"
      >
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
import DataTable from "@/components/CatalogDataTable.vue";
import StatsBox from "@/components/ui/StatsBox.vue";
import { useCatalogDataTableStore } from "@/store/DataTables/catalogDataTableStore";

const store = useCatalogDataTableStore();
const showStats = ref(false);
const statsItems = computed(() => store.statsCards);

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
  "flex h-[56px] w-[56px] cursor-pointer items-center justify-center rounded-[15px] bg-[#404040] hover:bg-[#505050] active:bg-[#505050] focus-visible:ring-0";

const statsToggleLabel = computed(() =>
  showStats.value ? "Скрыть статистику" : "Показать статистику",
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
