<script setup lang="ts">
defineProps<{
  items: Array<{ label: string; icon?: string; color?: string; onSelect: () => void }>;
}>();
</script>

<template>
  <UDropdownMenu :items="[items]">
    <UButton color="neutral" variant="ghost" class="rounded-xl text-slate-500 hover:bg-slate-100">
      <Icon name="heroicons:ellipsis-horizontal" class="h-5 w-5" />
    </UButton>
  </UDropdownMenu>
</template>
