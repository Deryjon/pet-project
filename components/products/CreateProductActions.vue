<script setup lang="ts">
withDefaults(
  defineProps<{
    submitting?: boolean;
  }>(),
  {
    submitting: false,
  },
);

const emit = defineEmits<{
  (e: "cancel"): void;
  (e: "save"): void;
  (e: "save-and-new"): void;
}>();
</script>

<template>
  <div class="mt-12 border-t border-[#3a3a3a] pt-6">
    <div class="flex flex-wrap items-center gap-3">
      <UButton
        color="neutral"
        variant="ghost"
        type="button"
        class="rounded-[12px] bg-[#404040] px-5 py-3"
        :disabled="submitting"
        @click="emit('cancel')"
      >
        Отмена
      </UButton>
      <UButton
        color="primary"
        variant="solid"
        type="button"
        class="rounded-[12px] bg-[#1f78ff] px-5 py-3"
        :loading="submitting"
        @click="emit('save')"
      >
        Сохранить
      </UButton>
      <UButton
        color="primary"
        variant="soft"
        type="button"
        class="rounded-[12px] px-5 py-3"
        :disabled="submitting"
        @click="emit('save-and-new')"
      >
        Сохранить и создать еще
      </UButton>
    </div>
  </div>
</template>

