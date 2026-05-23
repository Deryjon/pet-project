<script setup lang="ts">
import { computed, ref, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  modelValue?: string | null;
  placeholder?: string;
  clearable?: boolean;
}>(), {
  modelValue: "",
  placeholder: "Выберите дату",
  clearable: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  year: "numeric",
});

const todayDate = new Date();
const visibleMonth = ref(startOfMonth(parseModelDate(props.modelValue) || todayDate));

watch(
  () => props.modelValue,
  (nextValue) => {
    const parsed = parseModelDate(nextValue);
    if (parsed) visibleMonth.value = startOfMonth(parsed);
  },
);

const selectedDate = computed(() => parseModelDate(props.modelValue));

const label = computed(() => {
  if (!selectedDate.value) return props.placeholder;
  return selectedDate.value.toLocaleDateString("ru-RU");
});

const monthLabel = computed(() => {
  const label = monthFormatter.format(visibleMonth.value);
  return label.charAt(0).toUpperCase() + label.slice(1);
});

const calendarDays = computed(() => {
  const monthStart = startOfMonth(visibleMonth.value);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + monthEnd.getDate()) / 7) * 7;
  const firstDate = new Date(monthStart);
  firstDate.setDate(monthStart.getDate() - startOffset);

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + index);

    return {
      date,
      key: toIsoDate(date),
      day: date.getDate(),
      inMonth: date.getMonth() === visibleMonth.value.getMonth(),
      isToday: isSameDate(date, todayDate),
      isSelected: selectedDate.value ? isSameDate(date, selectedDate.value) : false,
    };
  });
});

function parseModelDate(value?: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDate(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function previousMonth() {
  visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() - 1, 1);
}

function nextMonth() {
  visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + 1, 1);
}

function selectDate(date: Date) {
  emit("update:modelValue", toIsoDate(date));
}

function setToday() {
  visibleMonth.value = startOfMonth(todayDate);
  emit("update:modelValue", toIsoDate(todayDate));
}

function clearDate() {
  emit("update:modelValue", "");
}
</script>

<template>
  <div v-bind="$attrs">
    <UPopover
      :content="{ align: 'start', side: 'bottom', sideOffset: 10 }"
      :ui="{ content: 'z-[120] w-[336px] overflow-hidden rounded-[24px] border border-white/10 bg-[#191919] p-0 shadow-[0_24px_70px_rgba(0,0,0,0.38)] ring-1 ring-white/5' }"
    >
      <button
        type="button"
        class="group flex h-[54px] w-full items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.06] px-4 text-left text-white outline-none transition hover:border-white/20 hover:bg-white/[0.09] focus:border-[#1f78ff]"
      >
        <span>
          <span class="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Дата
          </span>
          <span :class="modelValue ? 'text-white' : 'text-slate-300'" class="mt-0.5 block text-[15px] font-semibold">
            {{ label }}
          </span>
        </span>
        <span class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#1f78ff]/15 text-sky-300 transition group-hover:bg-[#1f78ff]/25">
          <Icon name="heroicons:calendar-days" class="h-5 w-5" />
        </span>
      </button>

      <template #content>
        <div class="p-4">
          <div class="flex items-center justify-between">
            <button
              type="button"
              aria-label="Предыдущий месяц"
              class="flex h-10 w-10 items-center justify-center rounded-[14px] text-slate-300 transition hover:bg-white/10 hover:text-white"
              @click="previousMonth"
            >
              <Icon name="heroicons:chevron-left" class="h-5 w-5" />
            </button>

            <p class="text-[16px] font-bold text-white">
              {{ monthLabel }}
            </p>

            <button
              type="button"
              aria-label="Следующий месяц"
              class="flex h-10 w-10 items-center justify-center rounded-[14px] text-slate-300 transition hover:bg-white/10 hover:text-white"
              @click="nextMonth"
            >
              <Icon name="heroicons:chevron-right" class="h-5 w-5" />
            </button>
          </div>

          <div class="mt-4 grid grid-cols-7 gap-1 text-center">
            <div
              v-for="day in weekDays"
              :key="day"
              class="py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
            >
              {{ day }}
            </div>

            <button
              v-for="item in calendarDays"
              :key="item.key"
              type="button"
              class="relative flex h-10 items-center justify-center rounded-[14px] text-[14px] font-semibold transition"
              :class="[
                item.isSelected
                  ? 'bg-[#1f78ff] text-white shadow-[0_10px_26px_rgba(31,120,255,0.35)]'
                  : item.inMonth
                    ? 'text-slate-100 hover:bg-white/10'
                    : 'text-slate-600 hover:bg-white/[0.04]',
                item.isToday && !item.isSelected ? 'ring-1 ring-[#1f78ff]/60' : '',
              ]"
              @click="selectDate(item.date)"
            >
              {{ item.day }}
            </button>
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <button
              type="button"
              class="rounded-[14px] border border-white/10 bg-white/[0.06] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10"
              @click="setToday"
            >
              Сегодня
            </button>

            <button
              v-if="clearable"
              type="button"
              class="rounded-[14px] px-4 py-2 text-[13px] font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
              @click="clearDate"
            >
              Сбросить
            </button>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
