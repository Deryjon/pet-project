<script setup lang="ts">
import { computed } from "vue";
import { getLocalTimeZone, parseDate, today, type DateValue } from "@internationalized/date";

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

const tz = getLocalTimeZone();

const value = computed<DateValue | undefined>({
  get() {
    if (!props.modelValue) return undefined;
    try {
      return parseDate(props.modelValue);
    } catch {
      return undefined;
    }
  },
  set(nextValue) {
    emit("update:modelValue", nextValue ? nextValue.toString() : "");
  },
});

const label = computed(() => {
  if (!value.value) return props.placeholder;
  return value.value.toDate(tz).toLocaleDateString("ru-RU");
});

function setToday() {
  emit("update:modelValue", today(tz).toString());
}

function clearDate() {
  emit("update:modelValue", "");
}
</script>

<template>
  <UPopover
    :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
    :ui="{ content: 'z-[120] w-[320px] rounded-[18px] border border-white/10 bg-slate-700 p-3 shadow-[0_18px_50px_rgba(2,6,23,0.28)]' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      class="h-[54px] w-full justify-between rounded-[18px] border border-white/10 bg-white/5 px-4 text-white hover:bg-white/10"
    >
      <span :class="modelValue ? 'text-white' : 'text-slate-300'">
        {{ label }}
      </span>
      <Icon name="heroicons:calendar-days" class="h-4 w-4 text-sky-300" />
    </UButton>

    <template #content>
      <div class="grid gap-3">
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="soft"
            class="rounded-[12px] border border-white/10 bg-white/5 text-white hover:bg-white/10"
            @click="setToday"
          >
            Сегодня
          </UButton>
          <UButton
            v-if="clearable"
            color="neutral"
            variant="soft"
            class="rounded-[12px] border border-white/10 bg-white/5 text-white hover:bg-white/10"
            @click="clearDate"
          >
            Сбросить
          </UButton>
        </div>

        <UCalendar
          v-model="value"
          color="neutral"

        />
      </div>
    </template>
  </UPopover>
</template>
