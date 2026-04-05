<template>
  <section v-if="draft" class="space-y-8">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-2 rounded-[14px] bg-[#363636] px-4 py-3 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[#4a4a4a]"
          @click="goBack"
        >
          <Icon name="heroicons:arrow-left-20-solid" class="h-5 w-5 text-[#4993dd]" />
          Назад
        </button>

        <p class="mt-5 text-[12px] font-bold uppercase tracking-[0.24em] text-[#7ba9d8]">
          Проверка корректности полей
        </p>
        <h1 class="mt-2 text-[34px] font-bold text-white">{{ draft.settings.name }}</h1>
        <p class="mt-2 text-[15px] text-[#bdbdbd]">
          Выберите, какие поля в загруженном файле должны подставляться для каждого свойства создаваемого товара.
        </p>
      </div>

      <div class="relative">
        <div class="flex gap-3">
          <button
            type="button"
            class="cursor-pointer rounded-[16px] bg-[#4a3030] px-5 py-4 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#613b3b]"
            @click="cancelDraft"
          >
            Отменить
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-[16px] bg-[#1f78ff] px-5 py-4 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-[#2a6ed9]"
            @click="isUploadMenuOpen = !isUploadMenuOpen"
          >
            Загрузить
          </button>
        </div>

        <div
          v-if="isUploadMenuOpen"
          class="absolute right-0 top-full z-20 mt-3 w-[260px] rounded-[20px] border border-white/10 bg-[#2f2f2f] p-3 shadow-xl"
        >
          <button
            type="button"
            class="flex w-full cursor-pointer items-start rounded-[14px] px-4 py-3 text-left transition-colors duration-200 hover:bg-[#3a3a3a]"
            @click="startUpload('with_validation')"
          >
            <span>
              <span class="block text-[15px] font-bold text-white">Загрузить с проверкой</span>
              <span class="mt-1 block text-[13px] text-[#bdbdbd]">Использовать выбранные правила сопоставления.</span>
            </span>
          </button>
          <button
            type="button"
            class="mt-1 flex w-full cursor-pointer items-start rounded-[14px] px-4 py-3 text-left transition-colors duration-200 hover:bg-[#3a3a3a]"
            @click="startUpload('without_validation')"
          >
            <span>
              <span class="block text-[15px] font-bold text-white">Загрузить без проверки</span>
              <span class="mt-1 block text-[13px] text-[#bdbdbd]">Сразу завершить импорт с текущими значениями.</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section class="rounded-[28px] bg-[#2b2b2b] p-6">
        <div class="space-y-4">
          <article
            v-for="mapping in draft.mappings"
            :key="mapping.key"
            class="rounded-[24px] border border-white/8 bg-[#363636] p-5"
          >
            <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_200px_220px]">
              <div>
                <p class="text-[13px] font-bold uppercase tracking-[0.18em] text-[#7ba9d8]">
                  {{ mapping.label }}
                </p>
                <div class="mt-3 rounded-[18px] bg-[#2b2b2b] px-4 py-4 text-[16px] text-white">
                  {{ mapping.sample || "Пусто" }}
                </div>
              </div>

              <div>
                <label class="text-[13px] font-bold uppercase tracking-[0.18em] text-[#9ea6b2]">
                  Действие
                </label>
                <select
                  :value="mapping.action"
                  class="mt-3 w-full rounded-[16px] border border-transparent bg-[#2b2b2b] px-4 py-4 text-[15px] text-white outline-none focus:border-[#4993dd]"
                  @change="onActionChange(mapping.key, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="skip">Не загружать</option>
                  <option value="new">Добавить новое свойство</option>
                  <option value="map">Выбрать свойство</option>
                </select>
              </div>

              <div>
                <label class="text-[13px] font-bold uppercase tracking-[0.18em] text-[#9ea6b2]">
                  Свойство
                </label>
                <select
                  :value="mapping.targetField"
                  class="mt-3 w-full rounded-[16px] border border-transparent bg-[#2b2b2b] px-4 py-4 text-[15px] text-white outline-none focus:border-[#4993dd]"
                  @change="onTargetChange(mapping.key, ($event.target as HTMLSelectElement).value)"
                >
                  <option
                    v-for="option in fieldOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>
          </article>
        </div>
      </section>

      <aside class="space-y-4">
        <div class="rounded-[28px] bg-[#2b2b2b] p-6">
          <p class="text-[13px] font-bold uppercase tracking-[0.18em] text-[#7ba9d8]">
            Параметры
          </p>
          <div class="mt-4 space-y-4 text-[15px] text-white">
            <div class="rounded-[18px] bg-[#363636] px-4 py-4">
              <p class="text-[#a7a7a7]">Тип импорта</p>
              <p class="mt-1 font-bold">{{ draft.settings.importType }}</p>
            </div>
            <div class="rounded-[18px] bg-[#363636] px-4 py-4">
              <p class="text-[#a7a7a7]">Генерировать баркоды</p>
              <p class="mt-1 font-bold">{{ draft.settings.generateBarcodes ? "Да" : "Нет" }}</p>
            </div>
            <div class="rounded-[18px] bg-[#363636] px-4 py-4">
              <p class="text-[#a7a7a7]">Генерировать артикулы</p>
              <p class="mt-1 font-bold">{{ draft.settings.generateArticles ? "Да" : "Нет" }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-[28px] bg-[#2b2b2b] p-6">
          <p class="text-[13px] font-bold uppercase tracking-[0.18em] text-[#7ba9d8]">
            Файл
          </p>
          <p class="mt-3 text-[16px] font-bold text-white">{{ draft.fileName }}</p>
          <p class="mt-2 text-[14px] text-[#bdbdbd]">
            {{ draft.rows.length }} строк • {{ totalQuantity }} ед. • {{ formatMoney(totalAmount) }}
          </p>
        </div>
      </aside>
    </div>

    <transition name="fade">
      <div
        v-if="draft.status === 'uploading'"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      >
        <div class="w-full max-w-[520px] rounded-[32px] bg-[#2b2b2b] p-8 text-white shadow-2xl">
          <p class="text-[12px] font-bold uppercase tracking-[0.22em] text-[#7ba9d8]">
            Импорт выполняется
          </p>
          <h2 class="mt-3 text-[30px] font-bold">Загрузка товаров</h2>
          <p class="mt-2 text-[15px] text-[#bdbdbd]">
            Обрабатываем файл, создаем свойства и подготавливаем товары к импорту.
          </p>

          <div class="mt-6 rounded-full bg-[#404040] p-1">
            <div
              class="h-4 rounded-full bg-[#1f78ff] transition-all duration-300"
              :style="{ width: `${draft.progress}%` }"
            />
          </div>

          <div class="mt-4 flex items-center justify-between">
            <p class="text-[14px] text-[#bdbdbd]">Прогресс загрузки</p>
            <p class="text-[22px] font-bold">{{ draft.progress }}%</p>
          </div>
        </div>
      </div>
    </transition>
  </section>

  <section v-else class="rounded-[28px] bg-[#2b2b2b] p-8 text-white">
    <h1 class="text-[28px] font-bold">Черновик импорта не найден</h1>
    <p class="mt-3 text-[#bdbdbd]">Вернитесь к списку импортов и загрузите файл заново.</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import { useImportDataTableStore, type ParsedImportRow, type UploadMode } from "@/store/DataTables/importDataTableStore";

const route = useRoute();
const router = useRouter();
const importStore = useImportDataTableStore();

const detailId = computed(() => String(route.params.id ?? ""));
const draft = computed(() => importStore.getDraftByDetailId(detailId.value));
const isUploadMenuOpen = ref(false);

const fieldOptions = computed(() =>
  importStore.targetFieldOptions.map((value) => ({
    value,
    label: importStore.targetFieldLabels[value] ?? value,
  })),
);

const totalQuantity = computed(
  () => draft.value?.rows.reduce((sum, row) => sum + row.quantity, 0) ?? 0,
);
const totalAmount = computed(
  () => draft.value?.rows.reduce((sum, row) => sum + row.quantity * row.retailPrice, 0) ?? 0,
);

const goBack = () => router.push("/products/import");

const cancelDraft = () => {
  importStore.removeDraft(detailId.value);
  router.push("/products/import");
};

const onActionChange = (key: keyof ParsedImportRow, action: string) => {
  importStore.updateDraftMapping(detailId.value, key, { action: action as any });
};

const onTargetChange = (key: keyof ParsedImportRow, targetField: string) => {
  importStore.updateDraftMapping(detailId.value, key, { targetField, action: "map" });
};

const startUpload = async (mode: UploadMode) => {
  isUploadMenuOpen.value = false;
  const uploadedDetailId = await importStore.startDraftUpload(detailId.value, mode);
  if (uploadedDetailId) {
    router.push(`/products/import/list/${uploadedDetailId}?limit=5&page=1`);
  }
};

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} UZS`;

onMounted(() => {
  importStore.fetchProductCharacteristics();
});

useHead({
  title: computed(() =>
    draft.value ? `${draft.value.settings.name} | Проверка импорта` : "Проверка импорта",
  ),
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
