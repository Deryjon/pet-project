<script setup lang="ts">
import { computed, ref } from "vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import { useDashboardStore } from "@/store/dashboard";

const store = useDashboardStore();

const tz = getLocalTimeZone();
const currentDay = today(tz);

const selectedRange = ref({
  start: currentDay,
  end: currentDay,
});

const formatDate = (
  value: { toDate: (tz: string) => Date } | null | undefined,
) => {
  if (!value) return "";
  return value.toDate(tz).toLocaleDateString("ru-RU");
};

const selectedRangeLabel = computed(() => {
  const start = selectedRange.value?.start;
  const end = selectedRange.value?.end;
  if (!start || !end) return "Выберите диапазон";
  return `${formatDate(start)} - ${formatDate(end)}`;
});
</script>

<template>
  <div class=" flex justify-between">
    <div class="time-sales inline-flex gap-2 rounded-[15px] bg-[#404040] p-1">
      <button
        v-for="period in store.periods"
        :key="period.value"
        @click="store.setPeriod(period.value)"
        :class="[
          'h-[44px] w-[120px] rounded-[15px] px-[16px] text-center font-semibold transition-colors',
          store.selectedPeriod === period.value
            ? 'bg-[#202020] text-white'
            : 'bg-[#404040] hover:bg-[#505050]',
        ]"
      >
        {{ period.label }}
      </button>
    </div>

    <div class="">
      <UPopover
        :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
        :ui="{
          content: 'z-50  w-[320px] rounded-[15px] bg-[#262626] p-3 shadow-xl',
        }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          class=" flex w-[320px] items-center justify-between rounded-[15px] bg-[#404040] px-4 py-4 text-left text-white hover:bg-[#505050] active:bg-[#505050] focus-visible:ring-0"
        >
          <span>{{ selectedRangeLabel }}</span>
          <Icon name="ph:calendar" class="h-4 w-4 text-[#3b82f6]" />
        </UButton>

        <template #content>
          <UCalendar
            v-model="selectedRange"
            color="neutral"
            range
            size="md"
            class="w-full rounded-[12px] bg-[#262626] text-white"
            :ui="{
              root: 'bg-[#262626] text-white',
              header: 'text-white',
              heading: 'text-white',
              gridWeekDaysRow: 'text-[#bdbdbd]',
            }"
          />
        </template>
      </UPopover>
    </div>
  </div>
</template>
