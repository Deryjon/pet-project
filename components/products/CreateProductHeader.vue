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
      <div class="flex items-center justify-between py-[32px]">
        <div class="flex items-center gap-4">
          <UButton
            color="neutral"
            variant="soft"
            square
            class="h-[50px] w-[50px] justify-center rounded-full bg-[#404040]"
            @click="emit('back')"
          >
            <Icon name="tabler:chevron-left" class="h-6 w-6 text-[#1f78ff]" />
          </UButton>
          <h2 class="text-4xl font-bold">{{ mode === "edit" ? "Изменить продукт" : "Новый продукт" }}</h2>
        </div>

        <UButton
          color="primary"
          variant="solid"
          class="rounded-[18px] bg-[#1f78ff] px-[30px] py-[12px] text-[16px] font-semibold text-white hover:bg-[#4d94ff]"
          :loading="submitting"
          @click="emit('create')"
        >
          {{ mode === "edit" ? "Сохранить" : "Создать" }}
        </UButton>
      </div>
    </div>
  </div>
</template>
