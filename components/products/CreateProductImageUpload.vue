<script setup lang="ts">
import { ref } from "vue";
import type { ProductImage } from "~/types/product-create";

const props = withDefaults(
  defineProps<{
    modelValue: ProductImage[];
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: ProductImage[]): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);

function toImage(file: File): ProductImage {
  return {
    id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    file,
    name: file.name,
    size: file.size,
    previewUrl: URL.createObjectURL(file),
  };
}

function setSingleImage(file?: File | null) {
  if (!file || !file.type.startsWith("image/")) return;
  props.modelValue.forEach((img) => URL.revokeObjectURL(img.previewUrl));
  emit("update:modelValue", [toImage(file)]);
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  setSingleImage(target?.files?.[0] ?? null);
  if (target) target.value = "";
}

function onDrop(event: DragEvent) {
  dragOver.value = false;
  if (props.disabled) return;
  const file = event.dataTransfer?.files?.[0];
  setSingleImage(file ?? null);
}

function removeImage(id: string) {
  const image = props.modelValue.find((img) => img.id === id);
  if (image) URL.revokeObjectURL(image.previewUrl);
  emit(
    "update:modelValue",
    props.modelValue.filter((img) => img.id !== id),
  );
}
</script>

<template>
  <div class="mt-4">
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      :disabled="disabled"
      @change="onFileChange"
    />

    <button
      type="button"
      class="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
      :class="
        dragOver
          ? 'border-[#1f78ff] bg-[#2a3f5e]'
          : 'border-gray-300 bg-[#404040] hover:bg-[#505050]'
      "
      :disabled="disabled"
      @click="fileInputRef?.click()"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <p>Перетащите фото в эту область</p>
      <p class="text-sm text-gray-400">- или -</p>
      <p class="text-blue-300">Нажмите для обзора</p>
    </button>

    <div v-if="modelValue.length" class="mt-4 space-y-2">
      <div
        v-for="image in modelValue"
        :key="image.id"
        class="flex items-center justify-between rounded-lg bg-[#3a3a3a] p-3"
      >
        <div class="flex min-w-0 items-center gap-3">
          <img :src="image.previewUrl" alt="preview" class="h-12 w-12 rounded object-cover" />
          <div class="min-w-0">
            <p class="truncate text-sm">{{ image.name }}</p>
            <p class="text-xs text-gray-400">{{ Math.round(image.size / 1024) }} KB</p>
          </div>
        </div>

        <UButton color="neutral" variant="ghost" type="button" @click.stop="removeImage(image.id)">
          Удалить
        </UButton>
      </div>
    </div>
  </div>
</template>

