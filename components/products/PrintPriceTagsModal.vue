<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useApi } from "~/composables/useApi";
import {
  usePriceTagsData,
  type PriceTagTemplate,
  type PriceTagProduct,
} from "@/composables/usePriceTagsData";
import { usePrintWindow } from "@/composables/usePrintWindow";
import PriceTag from "@/components/print/PriceTag.vue";

const props = defineProps<{
  modelValue: boolean;
  productIds: Array<string | number>;
}>();

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

const { apiFetch } = useApi();
const { fetchPriceTagTemplateList, createPriceTagTemplate, deletePriceTagTemplate, fetchPriceTags } =
  usePriceTagsData();
const { openPriceTagsPrint } = usePrintWindow();
const toast = useToast();

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const loading = ref(false);
const productsError = ref("");
const templates = ref<PriceTagTemplate[]>([]);
const selectedTemplateId = ref("");
const shops = ref<Array<{ id: string; name: string; branchCode: string }>>([]);
const selectedBranchCode = ref("");
const quantityMode = ref<"manual" | "stock">("manual");
const manualCopies = ref(1);
const showDiscount = ref(true);
const printOnA4 = ref(false);
const products = ref<PriceTagProduct[]>([]);

const showCreateForm = ref(false);
const newName = ref("");
const newWidth = ref(40);
const newLength = ref(20);
const newBarcodeType = ref("CODE128");

const PREVIEW_ZOOM = 3;
const MM_TO_PX = 3.7795275591; // real CSS mm-to-px ratio — must match PriceTag.vue exactly

const selectedTemplate = computed(() => templates.value.find((t) => t.id === selectedTemplateId.value) ?? null);
const previewProduct = computed<PriceTagProduct | null>(() => products.value[0] ?? null);
const previewWidthPx = computed(() => (selectedTemplate.value?.width ?? 40) * MM_TO_PX * PREVIEW_ZOOM);
const previewHeightPx = computed(() => (selectedTemplate.value?.length ?? 20) * MM_TO_PX * PREVIEW_ZOOM);

async function fetchShops() {
  const res: any = await apiFetch("/shop", { method: "GET", query: { limit: 1000 } });
  return Array.isArray(res?.shops)
    ? res.shops.map((s: any) => ({
        id: String(s.id ?? ""),
        name: String(s.name ?? ""),
        branchCode: String(s.branch_code ?? ""),
      }))
    : [];
}

async function reloadProducts() {
  if (!props.productIds.length) {
    products.value = [];
    productsError.value = "";
    return;
  }
  try {
    products.value = await fetchPriceTags(
      props.productIds.map(String),
      {},
      selectedBranchCode.value || undefined,
    );
    productsError.value = products.value.length ? "" : "Товар не найден.";
  } catch (e: any) {
    console.error("PrintPriceTagsModal: failed to load product data", e);
    products.value = [];
    productsError.value = e?.data?.message || e?.message || "Не удалось загрузить данные товара.";
  }
}

async function open() {
  loading.value = true;
  try {
    templates.value = await fetchPriceTagTemplateList().catch((e) => {
      console.error("PrintPriceTagsModal: failed to load templates", e);
      return [];
    });
    if (!selectedTemplateId.value || !templates.value.some((t) => t.id === selectedTemplateId.value)) {
      selectedTemplateId.value = templates.value[0]?.id ?? "";
    }
    shops.value = await fetchShops().catch((e) => {
      console.error("PrintPriceTagsModal: failed to load shops", e);
      return [];
    });
    await reloadProducts();
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) open();
  },
);
watch(selectedBranchCode, reloadProducts);

function close() {
  isOpen.value = false;
  showCreateForm.value = false;
}

function startCreate() {
  newName.value = "";
  newWidth.value = 40;
  newLength.value = 20;
  newBarcodeType.value = "CODE128";
  showCreateForm.value = true;
}

async function confirmCreate() {
  if (!newName.value.trim()) return;
  try {
    const created = await createPriceTagTemplate({
      name: newName.value.trim(),
      width: newWidth.value,
      length: newLength.value,
      barcodeType: newBarcodeType.value,
    });
    templates.value.unshift(created);
    selectedTemplateId.value = created.id;
    showCreateForm.value = false;
  } catch (e: any) {
    toast.add({ title: "Не удалось создать шаблон", description: e?.data?.message || e?.message, color: "error" });
  }
}

function editTemplate() {
  if (!selectedTemplate.value) return;
  window.open(
    `/products/settings/print-tag?templateId=${encodeURIComponent(selectedTemplate.value.id)}`,
    "_blank",
  );
}

async function removeTemplate() {
  const tpl = selectedTemplate.value;
  if (!tpl) return;
  if (!confirm(`Удалить шаблон «${tpl.name}»?`)) return;
  try {
    await deletePriceTagTemplate(tpl.id);
    templates.value = templates.value.filter((t) => t.id !== tpl.id);
    selectedTemplateId.value = templates.value[0]?.id ?? "";
  } catch (e: any) {
    toast.add({ title: "Не удалось удалить шаблон", description: e?.data?.message || e?.message, color: "error" });
  }
}

function computeCopies(): Record<string, number> {
  const copies: Record<string, number> = {};
  for (const p of products.value) {
    copies[String(p.id)] =
      quantityMode.value === "stock" ? Math.max(1, Math.round(p.quantity || 1)) : Math.max(1, manualCopies.value);
  }
  return copies;
}

function confirmPrint() {
  if (!selectedTemplate.value || !products.value.length) return;
  openPriceTagsPrint(props.productIds, computeCopies(), {
    branchId: selectedBranchCode.value || undefined,
    templateId: selectedTemplate.value.id || undefined,
    showDiscount: showDiscount.value,
    a4: printOnA4.value,
  });
  close();
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{
      overlay: 'z-[110] bg-black/50 backdrop-blur-sm',
      content: 'z-[120] max-w-[720px] rounded-[28px] bg-[#262626] p-0 text-white border border-white/10',
    }"
  >
    <template #content>
      <div class="p-7">
        <h3 class="text-[22px] font-bold">Печать ценников</h3>
        <p class="mt-2 text-[14px] text-[#9a9a9a]">Выберите шаблон, магазин и количество экземпляров.</p>

        <div v-if="loading" class="mt-6 flex items-center justify-center gap-2 py-10 text-[#9a9a9a]">
          <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
          Загрузка...
        </div>

        <div v-else class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
          <div class="space-y-4">
            <div>
              <span class="label">Шаблон ценника</span>
              <div class="flex items-center gap-2">
                <select v-model="selectedTemplateId" class="input flex-1">
                  <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
                <button type="button" class="icon-btn" title="Создать шаблон" @click="startCreate">
                  <Icon name="heroicons:plus" class="h-4 w-4" />
                </button>
                <button type="button" class="icon-btn" title="Изменить шаблон" :disabled="!selectedTemplate" @click="editTemplate">
                  <Icon name="heroicons:pencil-square" class="h-4 w-4" />
                </button>
                <button type="button" class="icon-btn icon-btn-danger" title="Удалить шаблон" :disabled="!selectedTemplate" @click="removeTemplate">
                  <Icon name="heroicons:trash" class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div v-if="showCreateForm" class="create-form">
              <input v-model="newName" class="input" placeholder="Название шаблона" />
              <div class="grid grid-cols-2 gap-2">
                <input type="number" min="10" v-model.number="newWidth" class="input" placeholder="Ширина, мм" />
                <input type="number" min="10" v-model.number="newLength" class="input" placeholder="Высота, мм" />
              </div>
              <div class="flex items-center gap-2">
                <button type="button" class="btn btn-primary" :disabled="!newName.trim()" @click="confirmCreate">Создать</button>
                <button type="button" class="btn btn-ghost" @click="showCreateForm = false">Отмена</button>
              </div>
            </div>

            <div>
              <span class="label">Магазин</span>
              <select v-model="selectedBranchCode" class="input">
                <option value="">Все магазины</option>
                <option v-for="s in shops" :key="s.id" :value="s.branchCode">{{ s.name }}</option>
              </select>
            </div>

            <div>
              <span class="label">Количество ценников</span>
              <div class="segmented">
                <button type="button" :class="{ active: quantityMode === 'manual' }" @click="quantityMode = 'manual'">Вручную</button>
                <button type="button" :class="{ active: quantityMode === 'stock' }" @click="quantityMode = 'stock'">По остаткам</button>
              </div>
              <input
                v-if="quantityMode === 'manual'"
                type="number"
                min="1"
                v-model.number="manualCopies"
                class="input mt-2"
              />
              <p v-else class="hint">Количество копий = остаток товара в выбранном магазине.</p>
            </div>

            <label class="switch-row">
              <span>Показывать специальную скидку</span>
              <input type="checkbox" v-model="showDiscount" />
            </label>
            <label class="switch-row">
              <span>Печать в формате A4</span>
              <input type="checkbox" v-model="printOnA4" />
            </label>
          </div>

          <div class="preview-column">
            <span class="label">Предпросмотр</span>
            <div v-if="!templates.length" class="preview-placeholder">
              <p>Нет ни одного шаблона ценника.</p>
              <button type="button" class="btn btn-primary mt-3" @click="startCreate">Создать шаблон</button>
            </div>
            <div v-else-if="!previewProduct" class="preview-placeholder">
              <p>{{ productsError || "Не удалось загрузить данные товара." }}</p>
            </div>
            <template v-else>
              <div class="preview-frame" :style="{ width: previewWidthPx + 'px', height: previewHeightPx + 'px' }">
                <div :style="{ transform: `scale(${PREVIEW_ZOOM})`, transformOrigin: 'top left' }">
                  <PriceTag
                    v-if="selectedTemplate"
                    :product="previewProduct"
                    :template="selectedTemplate"
                    :show-discount="showDiscount"
                  />
                </div>
              </div>
              <p v-if="selectedTemplate && !selectedTemplate.elements.length" class="hint mt-2">
                В шаблоне нет ни одного свойства для отображения.
                <button type="button" class="link-btn" @click="editTemplate">Открыть редактор</button>
              </p>
            </template>
          </div>
        </div>

        <div class="mt-7 flex items-center justify-end gap-3">
          <button type="button" class="btn btn-ghost" @click="close">Отмена</button>
          <button type="button" class="btn btn-primary" :disabled="!selectedTemplate || !products.length" @click="confirmPrint">
            Печать
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #d7d7d7; }
.hint { font-size: 12px; color: #8a8a8a; margin-top: 6px; }
.link-btn { color: #5a9eff; text-decoration: underline; font-size: 12px; margin-left: 4px; }
.preview-placeholder {
  width: 220px; min-height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; border: 1px dashed rgba(255,255,255,0.15); border-radius: 12px; padding: 20px;
  color: #8a8a8a; font-size: 13px;
}
.input {
  width: 100%; min-height: 44px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
  background: #1f1f1f; padding: 0 12px; color: white; outline: none; font-size: 13px;
}
select.input { cursor: pointer; }
.icon-btn {
  flex-shrink: 0; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  background: #333; color: #ccc; transition: background 0.15s;
}
.icon-btn:hover:not(:disabled) { background: #404040; }
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.icon-btn-danger:hover:not(:disabled) { color: #f87171; }

.create-form { display: grid; gap: 8px; padding: 12px; border-radius: 14px; background: #1f1f1f; border: 1px solid rgba(255,255,255,0.08); }

.segmented { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.segmented button { min-height: 38px; border-radius: 10px; background: #1f1f1f; color: #9a9a9a; font-size: 13px; font-weight: 600; }
.segmented button.active { background: #1f78ff; color: white; }

.switch-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 44px; border-radius: 12px; background: #1f1f1f; padding: 0 14px;
  color: #e8e8e8; font-size: 13px; font-weight: 600;
}
.switch-row input { width: 18px; height: 18px; accent-color: #1f78ff; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; border-radius: 14px; padding: 0 20px; font-weight: 700; font-size: 14px; }
.btn-primary { background: #1f78ff; color: white; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-ghost { background: #404040; color: white; }

.preview-column { display: flex; flex-direction: column; align-items: center; }
.preview-frame { position: relative; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
.preview-frame > div { position: relative; }
</style>
