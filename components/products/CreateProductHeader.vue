<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
const emit = defineEmits<{ (e: "create"): void }>();
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
            <Icon
              name="heroicons:chevron-left"
              class="h-6 w-6 text-[#1f78ff]"
            />
          </UButton>
          <h2 class="text-[28px] font-bold">Новый продукт</h2>
        </div>

        <UButton
          @click="emit('create')"
          color="primary"
          variant="solid"
          class="rounded-[20px] bg-[#1f78ff] px-[30px] py-[12px] text-[16px] font-semibold hover:bg-[#4d94ff]"
        >
          Создать
        </UButton>
      </div>
    </div>
  </div>
</template>
