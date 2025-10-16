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

    <!--Показываеминфотолькоеслименюоткрыто-->
    <div v-if="!collapsed" class="user-info">
      <p class="text-white truncate max-w-[120px]">
        {{ fullName || user.name || "..." }}
      </p>
      <p class="text-[#bdbdbd] truncate max-w-[120px]">
        {{ selectedLocation?.name || "..." }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUserStore } from "@/store/useUserStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useSidebarStore } from "../../store/useSidebar"; //👈подключаемpinia

const { selectedLocation } = storeToRefs(useLocationStore());
const { user, fullName } = storeToRefs(useUserStore());
const { collapsed } = storeToRefs(useSidebarStore());

defineEmits(["toggle"]);
</script>
