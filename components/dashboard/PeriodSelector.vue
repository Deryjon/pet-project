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

const selectedRangeModel = computed({
  get: () => selectedRange.value as any,
  set: (value) => {
    selectedRange.value = value as any;
  },
});

const formatDate = (value: { toDate: (tz: string) => Date } | null | undefined) => {
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
  <div class="flex justify-between">
    <div class="time-sales bg-[#404040] inline-flex gap-2 mb-4 p-1 rounded-[15px]">
      <button
        v-for="period in store.periods"
        :key="period.value"
        @click="store.setPeriod(period.value)"
        :class="[ 
          'w-[120px] px-[16px] py-[10px] text-center rounded-[15px] font-semibold text-white transition-colors cursor-pointer',
          store.selectedPeriod === period.value
            ? 'bg-[#505050] text-[#3b82f6]'
            : 'bg-[#404040] hover:bg-[#505050]',
        ]"
      >
        {{ period.label }}
      </button>
    </div>
    <div class="date-picker bg-[#404040] inline-flex mb-4 p-1 rounded-[15px]">
      <UPopover
        :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
        :ui="{ content: 'z-50 w-[320px] p-3 rounded-[15px] bg-[#404040] border border-[#5e5e5e] shadow-xl' }"
      >
        <button
          type="button"
          class="flex w-[320px] items-center justify-between rounded-[15px] px-[16px] py-[10px] text-left text-white font-semibold transition-colors bg-[#404040] hover:bg-[#505050] cursor-pointer"
        >
          <span>{{ selectedRangeLabel }}</span>
          <Icon name="ph:calendar" class="h-4 w-4 text-[#3b82f6]" />
        </button>

        <template #content>
          <UCalendar
            v-model="selectedRangeModel"
            color="neutral"
            variant="soft"
            range
            size="md"
            :prevMonth="{ class: 'text-white hover:text-white' }"
            :nextMonth="{ class: 'text-white hover:text-white' }"
            :prevYear="{ class: 'text-white hover:text-white' }"
            :nextYear="{ class: 'text-white hover:text-white' }"
            class="period-calendar w-full rounded-[12px] bg-[#404040] text-white"
            :ui="{
              root: 'bg-[#404040] text-white',
              body: 'bg-[#404040]',
              header: 'text-white',
              heading: 'text-white',
              grid: 'bg-[#404040]',
              gridBody: 'bg-[#404040]',
              gridRow: 'bg-[#404040]',
              gridWeekDaysRow: 'text-white',
              headCell: 'text-white',
              cellTrigger: 'text-white data-[selected]:text-[#3b82f6]',
            }"
          />
        </template>
      </UPopover>
    </div>
  </div>
</template>

<style scoped>
.period-calendar :deep([data-slot="grid"]),
.period-calendar :deep([data-slot="gridBody"]),
.period-calendar :deep([data-slot="gridRow"]),
.period-calendar :deep([data-slot="body"]),
.period-calendar :deep([data-slot="header"]),
.period-calendar :deep([data-slot="root"]) {
  background-color: #404040;
}

.period-calendar :deep([data-slot="cellTrigger"]) {
  color: #ffffff;
}

.period-calendar :deep([data-slot="cellTrigger"][data-selected]) {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.12);
}
</style>
