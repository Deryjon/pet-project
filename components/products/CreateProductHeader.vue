<script setup lang="ts">
withDefaults(
  defineProps<{
    submitting?: boolean;
    mode?: "create" | "edit";
  }>(),
  {
    submitting: false,
    mode: "create",
  },
);

const emit = defineEmits<{
  (e: "create"): void;
  (e: "back"): void;
}>();
</script>

<template>
  <div class="sticky top-0 z-50 border-b bg-[#262626]">
    <div class="mx-auto w-full max-w-[1680px] px-4 sm:px-6">
      <div class="flex flex-col gap-4 py-5 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-center gap-3 sm:gap-4">
          <UButton
            color="neutral"
            variant="soft"
            square
            class="h-[44px] w-[44px] shrink-0 justify-center rounded-full bg-[#404040] sm:h-[50px] sm:w-[50px]"
            @click="emit('back')"
          >
            <Icon name="tabler:chevron-left" class="h-6 w-6 text-[#1f78ff]" />
          </UButton>
          <h2 class="min-w-0 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            {{ mode === "edit" ? "Изменить продукт" : "Новый продукт" }}
          </h2>
        </div>

        <UButton
          color="primary"
          variant="solid"
          class="w-full justify-center rounded-[18px] bg-[#1f78ff] px-5 py-3 text-[15px] font-semibold text-white hover:bg-[#4d94ff] sm:w-auto sm:px-[30px] sm:text-[16px]"
          :loading="submitting"
          @click="emit('create')"
        >
          {{ mode === "edit" ? "Сохранить" : "Создать" }}
        </UButton>
      </div>
    </div>
  </div>
</template>
