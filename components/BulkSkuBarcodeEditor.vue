<script setup lang="ts">
import { ref, watch } from "vue";
import { useProducts } from "~/composables/useProducts";
import type { CreateProductApiPayload, ProductType } from "~/types/product-create";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [value: boolean] }>();

const { listProducts, generateBarcode, generateSku, updateProduct } = useProducts();
const toast = useToast();

interface EditableProduct {
  id: string | number;
  name: string;
  currentSku: string;
  currentBarcode: string;
  newSku: string;
  newBarcode: string;
  _raw: any;
  hasSkuIssue: boolean;
  hasBarcodeIssue: boolean;
}

const items = ref<EditableProduct[]>([]);
const loading = ref(false);
const generating = ref(false);
const saving = ref(false);
const progress = ref(0);
const progressTotal = ref(0);

const AUTO_SKU = /^SKU-[0-9a-f]{8,}$/i;
const AUTO_BC = /^BC-[0-9a-f]{8,}$/i;

function isAutoSku(v: string) { return AUTO_SKU.test(v.trim()); }
function isAutoBarcode(v: string) { return AUTO_BC.test(v.trim()); }

async function load() {
  loading.value = true;
  items.value = [];
  try {
    const result = await listProducts({ page: 1, pageSize: 200, statistics: false });
    items.value = result.products
      .filter((p) => isAutoSku(p.sku) || isAutoBarcode(p.barcode))
      .map((p) => ({
        id: p.id,
        name: p.name,
        currentSku: p.sku,
        currentBarcode: p.barcode,
        newSku: p.sku,
        newBarcode: p.barcode,
        _raw: (p as any)._original ?? p,
        hasSkuIssue: isAutoSku(p.sku),
        hasBarcodeIssue: isAutoBarcode(p.barcode),
      }));
  } catch (e: any) {
    toast.add({ title: "Ошибка загрузки товаров", description: e?.message ?? "Неизвестная ошибка", color: "error" });
  } finally {
    loading.value = false;
  }
}

async function generateAll() {
  if (generating.value) return;
  generating.value = true;
  progress.value = 0;
  progressTotal.value = items.value.length;
  const reservedBarcodes: string[] = [];
  for (const item of items.value) {
    try {
      if (item.hasSkuIssue) {
        item.newSku = await generateSku({ name: item.name });
      }
      if (item.hasBarcodeIssue) {
        item.newBarcode = await generateBarcode(reservedBarcodes);
        if (item.newBarcode) reservedBarcodes.push(item.newBarcode);
      }
    } catch {
      // Keep existing value on error
    }
    progress.value++;
  }
  generating.value = false;
}

function buildPayload(raw: any, sku: string, barcode: string): CreateProductApiPayload {
  const shopPrices = Array.isArray(raw?.shop_prices)
    ? raw.shop_prices
        .map((sp: any) => ({
          shop_id: String(sp.shop_id || sp.shop?.id || ""),
          supply_price: Number(sp.supply_price ?? 0),
          retail_price: Number(sp.retail_price ?? 0),
          wholesale_price: Number(sp.wholesale_price ?? 0),
        }))
        .filter((sp: any) => sp.shop_id)
    : undefined;

  const supplierIds = Array.isArray(raw?.suppliers)
    ? raw.suppliers.map((s: any) => s.id || s.supplier_id).filter(Boolean)
    : undefined;

  const categoryIds = Array.isArray(raw?.categories)
    ? raw.categories.map((c: any) => c.id || c.category_id).filter(Boolean)
    : Array.isArray(raw?.category_ids)
      ? raw.category_ids
      : raw?.category?.id
        ? [raw.category.id]
        : undefined;

  return {
    name: String(raw?.name || raw?.base_name || ""),
    sku: sku || undefined,
    barcode: barcode || undefined,
    product_type_id: (raw?.product_type || raw?.product_type_id || "goods") as ProductType,
    measurement_type: String(
      raw?.measurement_unit?.type ||
        raw?.measurement_type ||
        raw?.unit ||
        "piece",
    ),
    measurement_unit_id: raw?.measurement_unit_id
      ? String(raw.measurement_unit_id)
      : undefined,
    description: raw?.description || undefined,
    brand_name: raw?.brand_name || raw?.brand?.name || undefined,
    supplier_ids: supplierIds,
    category_ids: categoryIds,
    supply_price: shopPrices
      ? undefined
      : Number(raw?.supply_price ?? raw?.purchase_price ?? 0),
    retail_price: shopPrices
      ? undefined
      : Number(raw?.retail_price ?? raw?.sale_price ?? raw?.price ?? 0),
    shop_prices: shopPrices,
  };
}

async function saveAll() {
  if (saving.value) return;
  saving.value = true;
  progress.value = 0;
  progressTotal.value = items.value.length;
  let ok = 0;
  let fail = 0;
  for (const item of items.value) {
    const changed =
      item.newSku !== item.currentSku || item.newBarcode !== item.currentBarcode;
    if (changed) {
      try {
        const payload = buildPayload(item._raw, item.newSku, item.newBarcode);
        await updateProduct(item.id, payload);
        ok++;
      } catch {
        fail++;
      }
    }
    progress.value++;
  }
  saving.value = false;
  if (fail === 0) {
    toast.add({ title: `Обновлено товаров: ${ok}`, color: "success" });
    emit("update:open", false);
  } else {
    toast.add({
      title: `Обновлено: ${ok}, ошибок: ${fail}`,
      color: fail > 0 ? "warning" : "success",
    });
  }
}

watch(
  () => props.open,
  (isOpen) => { if (isOpen) load(); },
);
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
    :ui="{
      content:
        'max-w-[960px] w-full rounded-[28px] bg-[#1e1e1e] p-0 text-white border border-white/10',
    }"
  >
    <template #content>
      <div class="flex h-[80vh] flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 px-7 py-5">
          <div>
            <h2 class="text-[20px] font-bold text-white">Массовое исправление артикулов и баркодов</h2>
            <p class="mt-1 text-[13px] text-[#9a9a9a]">
              Товары с авто-сгенерированным форматом (SKU-xxx / BC-xxx)
            </p>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            class="h-9 w-9 rounded-full"
            @click="emit('update:open', false)"
          >
            <Icon name="heroicons:x-mark" class="h-5 w-5" />
          </UButton>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-7 py-5">
          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-20">
            <Icon name="heroicons:arrow-path" class="h-8 w-8 animate-spin text-[#4993dd]" />
            <span class="ml-3 text-[15px] text-[#9a9a9a]">Загрузка товаров...</span>
          </div>

          <!-- Empty -->
          <div
            v-else-if="!loading && items.length === 0"
            class="flex flex-col items-center justify-center py-20 text-center"
          >
            <Icon name="heroicons:check-circle" class="h-12 w-12 text-emerald-400" />
            <p class="mt-4 text-[16px] font-semibold text-white">Всё в порядке</p>
            <p class="mt-2 text-[13px] text-[#9a9a9a]">
              Товары с авто-сгенерированным форматом не найдены
            </p>
          </div>

          <!-- Progress -->
          <div v-if="(generating || saving) && progressTotal > 0" class="mb-5">
            <div class="mb-2 flex justify-between text-[13px] text-[#9a9a9a]">
              <span>{{ saving ? "Сохранение..." : "Генерация..." }}</span>
              <span>{{ progress }} / {{ progressTotal }}</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-[#333]">
              <div
                class="h-full rounded-full bg-[#4993dd] transition-all duration-200"
                :style="{ width: `${Math.round((progress / progressTotal) * 100)}%` }"
              />
            </div>
          </div>

          <!-- Table -->
          <div v-if="!loading && items.length > 0" class="overflow-x-auto">
            <table class="w-full text-[13px]">
              <thead>
                <tr class="border-b border-white/10 text-left text-[#9a9a9a]">
                  <th class="pb-3 pr-4 font-medium">Наименование</th>
                  <th class="pb-3 pr-4 font-medium">Артикул (новый)</th>
                  <th class="pb-3 font-medium">Баркод (новый)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in items"
                  :key="String(item.id)"
                  class="border-b border-white/5 hover:bg-white/[0.02]"
                >
                  <td class="py-3 pr-4 text-white">
                    <div class="max-w-[220px] truncate font-medium">{{ item.name }}</div>
                    <div class="mt-0.5 text-[11px] text-[#666]">
                      {{ item.currentSku }} / {{ item.currentBarcode }}
                    </div>
                  </td>

                  <!-- SKU input -->
                  <td class="py-3 pr-4">
                    <input
                      v-model="item.newSku"
                      :disabled="saving || generating"
                      class="w-full rounded-[10px] border border-white/10 bg-[#2a2a2a] px-3 py-2 text-[13px] text-white placeholder-[#555] focus:border-[#4993dd] focus:outline-none disabled:opacity-50"
                      :class="{ 'border-amber-500/50': isAutoSku(item.newSku) }"
                      placeholder="Артикул"
                    />
                  </td>

                  <!-- Barcode input -->
                  <td class="py-3">
                    <input
                      v-model="item.newBarcode"
                      :disabled="saving || generating"
                      class="w-full rounded-[10px] border border-white/10 bg-[#2a2a2a] px-3 py-2 text-[13px] text-white placeholder-[#555] focus:border-[#4993dd] focus:outline-none disabled:opacity-50"
                      :class="{ 'border-amber-500/50': isAutoBarcode(item.newBarcode) }"
                      placeholder="Баркод"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div
          v-if="!loading && items.length > 0"
          class="flex items-center justify-between border-t border-white/10 px-7 py-5"
        >
          <div class="text-[13px] text-[#9a9a9a]">
            Найдено товаров с проблемой: <span class="font-semibold text-white">{{ items.length }}</span>
          </div>
          <div class="flex items-center gap-3">
            <UButton
              color="neutral"
              variant="soft"
              :loading="generating"
              :disabled="saving"
              class="rounded-[14px] bg-[#333] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#404040]"
              @click="generateAll"
            >
              <Icon name="heroicons:arrow-path" class="mr-1.5 h-4 w-4" />
              Сгенерировать для всех
            </UButton>
            <UButton
              color="primary"
              variant="solid"
              :loading="saving"
              :disabled="generating"
              class="rounded-[14px] bg-[#4993dd] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#3a7bc8]"
              @click="saveAll"
            >
              <Icon name="heroicons:check" class="mr-1.5 h-4 w-4" />
              Сохранить все
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
