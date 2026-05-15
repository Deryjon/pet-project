<template>
  <div class="rounded-[24px] bg-white/[0.04] p-4">
    <label class="mb-3 block text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8f8f8f]">
      {{ label }}
    </label>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input
        type="number"
        :value="min"
        placeholder="От"
        class="w-full rounded-[16px] border border-white/8 bg-[#323232] px-4 py-4 text-[15px] text-white outline-none transition placeholder:text-[#757575] focus:border-[#4993dd] focus:bg-[#373737]"
        @input="$emit('update:min', ($event.target as HTMLInputElement)?.value ?? '')"
      />
      <input
        type="number"
        :value="max"
        placeholder="До"
        class="w-full rounded-[16px] border border-white/8 bg-[#323232] px-4 py-4 text-[15px] text-white outline-none transition placeholder:text-[#757575] focus:border-[#4993dd] focus:bg-[#373737]"
        @input="$emit('update:max', ($event.target as HTMLInputElement)?.value ?? '')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  min?: string | number;
  max?: string | number;
}>();

defineEmits(["update:min", "update:max"]);
</script>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
