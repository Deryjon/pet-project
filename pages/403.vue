<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Нет доступа | Konkurent" });
</script>

<template>
  <section class="flex min-h-[60vh] items-center justify-center text-white">
    <div class="max-w-[520px] rounded-[28px] border border-white/10 bg-[#262626] p-8 text-center">
      <p class="text-[56px] font-bold leading-none text-[#7fb0ff]">403</p>
      <h1 class="mt-4 text-[28px] font-bold">Нет доступа</h1>
      <p class="mt-3 text-[15px] leading-6 text-[#bdbdbd]">
        У вашей роли нет прав для просмотра этой страницы.
      </p>
      <NuxtLink
        to="/"
        class="mt-6 inline-flex rounded-[16px] bg-[#1f78ff] px-5 py-3 font-semibold text-white transition hover:bg-[#2a6ed9]"
      >
        На главную
      </NuxtLink>
    </div>
  </section>
</template>
