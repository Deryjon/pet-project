<script setup lang="ts">
import { useRouter } from "vue-router";

withDefaults(
  defineProps<{
    submitting?: boolean;
  }>(),
  {
    submitting: false,
  },
);

const emit = defineEmits<{
  (e: "create"): void;
}>();

const router = useRouter();
</script>

<template>
  <div class="sticky top-0 z-50 border-b bg-[#262626]">
    <div class="mx-auto px-[144px]">
      <div class="flex items-center justify-between py-[32px]">
        <div class="flex items-center gap-4">
          <UButton
            color="neutral"
            variant="soft"
            square
            class="h-[50px] w-[50px] justify-center rounded-full bg-[#404040]"
            @click="router.back()"
          >
            <Icon name="tabler:chevron-left" class="h-6 w-6 text-[#1f78ff]" />
          </UButton>
          <h2 class="text-4xl font-bold">Новый продукт</h2>
        </div>

        <UButton
          color="primary"
          variant="solid"
          class="rounded-[18px] bg-[#1f78ff] px-[30px] py-[12px] text-[16px] font-semibold text-white hover:bg-[#4d94ff]"
          :loading="submitting"
          @click="emit('create')"
        >
          Создать
        </UButton>
      </div>
    </div>
  </div>
</template>
