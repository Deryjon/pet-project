<template>
  <div
    @click.stop="$emit('toggle')"
    role="button"
    tabindex="0"
    class="flex items-center gap-3 cursor-pointer hover:bg-[#5e5e5e] rounded-[32px] p-2 transition-colors duration-300"
  
    >
    <img
      :src="user.avatarUrl"
      alt="Avatar"
      class="rounded-full w-[40px] h-[40px] object-cover"
    />
    <div class="user-info">
      <p class="text-white truncate max-w-[120px]">
        {{ user.name }}
      </p>

      <p class="text-[#bdbdbd] truncate max-w-[120px]">
        {{ user.location }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  user: { name: string; location: string; avatarUrl?: string };
}>();

defineEmits(["toggle"]);
</script>
