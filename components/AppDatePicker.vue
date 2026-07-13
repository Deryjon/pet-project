<script setup lang="ts">
import { computed, ref, watch } from "vue";

defineOptions({ inheritAttrs: false });

type DateRangeValue = {
  from?: string | null;
  to?: string | null;
};

const props = withDefaults(defineProps<{
  modelValue?: string | DateRangeValue | null;
  placeholder?: string;
  clearable?: boolean;
  selectionMode?: "single" | "range";
}>(), {
  modelValue: "",
  placeholder: "Выберите дату",
  clearable: false,
  selectionMode: "single",
});

const emit = defineEmits<{
  "update:modelValue": [value: string | DateRangeValue];
}>();

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const todayDate = new Date();
const visibleMonth = ref(startOfMonth(resolveInitialDate()));

watch(
  () => props.modelValue,
  (newVal, oldVal) => {
    // Don't reset visible month if only the `to` date changed during an active range selection —
    // otherwise the calendar jumps back to the start month after the user picks an end date.
    if (
      isRangeValue(newVal)
      && isRangeValue(oldVal)
      && newVal.from === oldVal.from
      && newVal.from
    ) {
      return;
    }
    visibleMonth.value = startOfMonth(resolveInitialDate());
  },
  { deep: true },
);

const selectedDate = computed(() => parseSingleValue(props.modelValue));
const selectedRange = computed(() => parseRangeValue(props.modelValue));
const isRangeMode = computed(() => props.selectionMode === "range");

const yearOptions = computed(() => {
  const currentYear = todayDate.getFullYear();
  return Array.from({ length: 131 }, (_, index) => currentYear + 5 - index);
});

const monthOptions = computed(() =>
  monthNames.map((label, value) => ({ label, value })),
);

const monthValue = computed({
  get: () => visibleMonth.value.getMonth(),
  set: (value: number) => {
    visibleMonth.value = new Date(visibleMonth.value.getFullYear(), Number(value), 1);
  },
});

const yearValue = computed({
  get: () => visibleMonth.value.getFullYear(),
  set: (value: number) => {
    visibleMonth.value = new Date(Number(value), visibleMonth.value.getMonth(), 1);
  },
});

const label = computed(() => {
  if (isRangeMode.value) {
    const from = selectedRange.value.from;
    const to = selectedRange.value.to;

    if (from && to) {
      return `${from.toLocaleDateString("ru-RU")} - ${to.toLocaleDateString("ru-RU")}`;
    }

    if (from) {
      return `С ${from.toLocaleDateString("ru-RU")}`;
    }

    return props.placeholder;
  }

  if (!selectedDate.value) return props.placeholder;
  return selectedDate.value.toLocaleDateString("ru-RU");
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

    const rangeFrom = selectedRange.value.from;
    const rangeTo = selectedRange.value.to;
    const inRange = rangeFrom && rangeTo ? isBetweenDates(date, rangeFrom, rangeTo) : false;

    return {
      date,
      key: toIsoDate(date),
      day: date.getDate(),
      inMonth: date.getMonth() === visibleMonth.value.getMonth(),
      isToday: isSameDate(date, todayDate),
      isSelected: isRangeMode.value
        ? Boolean((rangeFrom && isSameDate(date, rangeFrom)) || (rangeTo && isSameDate(date, rangeTo)))
        : Boolean(selectedDate.value && isSameDate(date, selectedDate.value)),
      isRangeStart: Boolean(rangeFrom && isSameDate(date, rangeFrom)),
      isRangeEnd: Boolean(rangeTo && isSameDate(date, rangeTo)),
      isInRange: inRange,
    };
  });
});

function resolveInitialDate() {
  if (isRangeValue(props.modelValue)) {
    return parseModelDate(props.modelValue.from) || parseModelDate(props.modelValue.to) || todayDate;
  }

  return parseModelDate(typeof props.modelValue === "string" ? props.modelValue : "") || todayDate;
}

function isRangeValue(value: unknown): value is DateRangeValue {
  return typeof value === "object" && value !== null && ("from" in value || "to" in value);
}

function parseSingleValue(value?: string | DateRangeValue | null) {
  if (typeof value !== "string") return null;
  return parseModelDate(value);
}

function parseRangeValue(value?: string | DateRangeValue | null) {
  if (!isRangeValue(value)) {
    return { from: null, to: null };
  }

  return {
    from: parseModelDate(value.from),
    to: parseModelDate(value.to),
  };
}

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

function isBeforeDate(first: Date, second: Date) {
  return first.getTime() < second.getTime();
}

function isBetweenDates(target: Date, from: Date, to: Date) {
  const time = target.getTime();
  return time > from.getTime() && time < to.getTime();
}

function previousMonth() {
  visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() - 1, 1);
}

function nextMonth() {
  visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + 1, 1);
}

function selectDate(date: Date) {
  if (!isRangeMode.value) {
    emit("update:modelValue", toIsoDate(date));
    return;
  }

  const nextDate = toIsoDate(date);
  const currentFrom = selectedRange.value.from ? toIsoDate(selectedRange.value.from) : "";
  const currentTo = selectedRange.value.to ? toIsoDate(selectedRange.value.to) : "";

  if (!currentFrom || (currentFrom && currentTo)) {
    emit("update:modelValue", {
      from: nextDate,
      to: "",
    });
    return;
  }

  const fromDate = parseModelDate(currentFrom);
  if (!fromDate) {
    emit("update:modelValue", {
      from: nextDate,
      to: "",
    });
    return;
  }

  if (isBeforeDate(date, fromDate)) {
    emit("update:modelValue", {
      from: nextDate,
      to: currentFrom,
    });
    return;
  }

  emit("update:modelValue", {
    from: currentFrom,
    to: nextDate,
  });
}

function setToday() {
  visibleMonth.value = startOfMonth(todayDate);

  if (isRangeMode.value) {
    const iso = toIsoDate(todayDate);
    emit("update:modelValue", {
      from: iso,
      to: iso,
    });
    return;
  }

  emit("update:modelValue", toIsoDate(todayDate));
}

function clearDate() {
  if (isRangeMode.value) {
    emit("update:modelValue", {
      from: "",
      to: "",
    });
    return;
  }

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
        class="group flex h-[54px] w-full items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.06] px-4 text-left text-white outline-none transition hover:border-white/20 hover:bg-white/[0.09] focus:border-[#1f78ff]"
      >
        <span class="min-w-0">
          <span class="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {{ isRangeMode ? "Период" : "Дата" }}
          </span>
          <span :class="modelValue ? 'text-white' : 'text-slate-300'" class="mt-1.5 block truncate text-[15px] font-semibold">
            {{ label }}
          </span>
        </span>
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#1f78ff]/15 text-sky-300 transition group-hover:bg-[#1f78ff]/25">
          <Icon name="heroicons:calendar-days" class="h-5 w-5" />
        </span>
      </button>

      <template #content>
        <div class="p-4">
          <div class="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Предыдущий месяц"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-slate-300 transition hover:bg-white/10 hover:text-white"
              @click="previousMonth"
            >
              <Icon name="heroicons:chevron-left" class="h-5 w-5" />
            </button>

            <div class="grid flex-1 grid-cols-[1fr_96px] gap-2">
              <select
                v-model="monthValue"
                class="h-10 rounded-[14px] border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white outline-none transition hover:bg-white/[0.09] focus:border-[#1f78ff]"
              >
                <option
                  v-for="month in monthOptions"
                  :key="month.value"
                  :value="month.value"
                  class="bg-[#1f1f1f] text-white"
                >
                  {{ month.label }}
                </option>
              </select>

              <select
                v-model="yearValue"
                class="h-10 rounded-[14px] border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white outline-none transition hover:bg-white/[0.09] focus:border-[#1f78ff]"
              >
                <option
                  v-for="year in yearOptions"
                  :key="year"
                  :value="year"
                  class="bg-[#1f1f1f] text-white"
                >
                  {{ year }}
                </option>
              </select>
            </div>

            <button
              type="button"
              aria-label="Следующий месяц"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-slate-300 transition hover:bg-white/10 hover:text-white"
              @click="nextMonth"
            >
              <Icon name="heroicons:chevron-right" class="h-5 w-5" />
            </button>
          </div>

          <p v-if="isRangeMode" class="mt-3 text-center text-[11px] uppercase tracking-[0.14em] text-slate-500">
            Выберите начало и конец периода
          </p>

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
                  : item.isInRange
                    ? 'bg-[#1f78ff]/15 text-sky-100'
                    : item.inMonth
                      ? 'text-slate-100 hover:bg-white/10'
                      : 'text-slate-600 hover:bg-white/[0.04]',
                item.isToday && !item.isSelected ? 'ring-1 ring-[#1f78ff]/60' : '',
                item.isRangeStart ? 'rounded-r-[8px]' : '',
                item.isRangeEnd ? 'rounded-l-[8px]' : '',
              ]"
              @click="selectDate(item.date)"
            >
              {{ item.day }}
            </button>
          </div>

          <div v-if="isRangeMode" class="mt-4 grid grid-cols-2 gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] p-3 text-sm">
            <div>
              <div class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">С</div>
              <div class="mt-1 text-white">
                {{ selectedRange.from ? selectedRange.from.toLocaleDateString("ru-RU") : "Не выбрано" }}
              </div>
            </div>
            <div>
              <div class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">По</div>
              <div class="mt-1 text-white">
                {{ selectedRange.to ? selectedRange.to.toLocaleDateString("ru-RU") : "Не выбрано" }}
              </div>
            </div>
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
