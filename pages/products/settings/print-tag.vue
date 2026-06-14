<template>
  <section class="operations h-screen flex flex-col bg-[#1a1a1a] text-white">
    <!-- Top bar -->
    <div class="border-b border-gray-700 flex-none">
      <div class="flex items-center justify-between gap-4 py-6 px-8">
        <div class="flex items-center gap-4">
          <div
            class="exit bg-[#404040] px-[15px] py-[12px] rounded-[25px] flex items-center gap-2 cursor-pointer font-bold text-[16px] hover:bg-[#5e5e5e] transition-colors"
            @click="router.back()"
          >
            <Icon name="heroicons:chevron-left" class="w-5 h-5" />
            Назад
          </div>
          <h2 class="text-[24px] font-bold">Печать ценников</h2>
          <span v-if="saving" class="text-xs text-gray-400 animate-pulse">Сохранение...</span>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn-dark" @click="printTest">Тест печати</button>
          <button class="btn-primary" :disabled="!selectedTemplate" @click="printAll">
            Печатать{{ printCount > 1 ? ` (${printCount})` : '' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 overflow-hidden flex">

      <!-- Left panel: Templates + Settings -->
      <div class="w-72 flex-none border-r border-gray-700 overflow-y-auto flex flex-col">
        <!-- Templates list -->
        <div class="p-4 border-b border-gray-700">
          <div class="flex items-center justify-between mb-3">
            <span class="font-semibold text-sm text-gray-300">Шаблоны</span>
            <button @click="createTemplate" class="text-[#1f78ff] text-sm hover:text-blue-400 transition-colors flex items-center gap-1">
              <Icon name="heroicons:plus" class="w-4 h-4" />
              Новый
            </button>
          </div>
          <div v-if="loadingTemplates" class="text-xs text-gray-400 py-4 text-center">Загрузка...</div>
          <div v-else-if="!templates.length" class="text-xs text-gray-400 py-4 text-center">Нет шаблонов</div>
          <div v-else class="space-y-1.5">
            <div
              v-for="tpl in templates"
              :key="tpl.id"
              @click="selectTemplate(tpl)"
              class="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors group"
              :class="selectedTemplate?.id === tpl.id ? 'bg-[#1f78ff]' : 'bg-[#2e2e2e] hover:bg-[#3a3a3a]'"
            >
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium truncate">{{ tpl.name }}</div>
                <div class="text-xs opacity-60 mt-0.5">{{ tpl.width }}×{{ tpl.length }} мм · {{ tpl.barcode_type }}</div>
              </div>
              <button
                @click.stop="deleteTemplate(tpl.id)"
                class="ml-2 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
              >
                <Icon name="heroicons:trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Template settings -->
        <div v-if="selectedTemplate" class="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <span class="font-semibold text-sm text-gray-300 block mb-3">Настройки шаблона</span>
            <label class="block mb-3">
              <span class="label">Название</span>
              <input v-model="editName" class="input text-sm" @blur="saveTemplate" />
            </label>
            <div class="flex gap-2 mb-3">
              <label class="block flex-1">
                <span class="label">Ширина (мм)</span>
                <input type="number" min="10" max="200" v-model.number="editWidth" class="input text-sm" @blur="saveTemplate" />
              </label>
              <label class="block flex-1">
                <span class="label">Высота (мм)</span>
                <input type="number" min="10" max="200" v-model.number="editLength" class="input text-sm" @blur="saveTemplate" />
              </label>
            </div>
            <label class="block">
              <span class="label">Тип штрих-кода</span>
              <select v-model="editBarcodeType" class="input text-sm" @change="saveTemplate">
                <option value="CODE128">CODE128</option>
                <option value="EAN13">EAN13</option>
                <option value="EAN8">EAN8</option>
                <option value="UPC">UPC-A</option>
              </select>
            </label>
          </div>

          <!-- Elements list with visibility toggle -->
          <div>
            <span class="font-semibold text-sm text-gray-300 block mb-3">Элементы</span>
            <div class="space-y-1">
              <div
                v-for="el in elements"
                :key="el.id"
                class="flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer transition-colors"
                :class="selectedEl?.id === el.id ? 'bg-[#3a3a3a]' : 'hover:bg-[#2e2e2e]'"
                @click="selectedEl = el"
              >
                <label class="flex items-center gap-2 cursor-pointer flex-1" @click.stop>
                  <input
                    type="checkbox"
                    v-model="el.visible"
                    class="w-3.5 h-3.5 accent-[#1f78ff]"
                    @change="saveTemplate"
                  />
                  <span class="text-sm">{{ el.label }}</span>
                </label>
                <span class="text-xs text-gray-500 ml-2">{{ el.x.toFixed(0) }},{{ el.y.toFixed(0) }}</span>
              </div>
            </div>
          </div>

          <!-- Print settings -->
          <div>
            <span class="font-semibold text-sm text-gray-300 block mb-3">Параметры печати</span>
            <label class="block mb-3">
              <span class="label">Количество копий</span>
              <input type="number" min="1" max="999" v-model.number="printCount" class="input text-sm" />
            </label>
            <label class="checkbox mb-2">
              <input type="checkbox" v-model="printOnA4" class="w-4 h-4 accent-[#1f78ff]" />
              <span class="text-sm">Печать на A4</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" v-model="showDiscount" class="w-4 h-4 accent-[#1f78ff]" />
              <span class="text-sm">Показать скидку</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Center: Visual editor -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div v-if="!selectedTemplate" class="flex-1 flex items-center justify-center">
          <div class="text-center text-gray-500">
            <Icon name="heroicons:tag" class="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Выберите шаблон или создайте новый</p>
          </div>
        </div>
        <template v-else>
          <!-- Toolbar -->
          <div class="flex items-center gap-4 px-6 py-3 border-b border-gray-700 flex-none flex-wrap">
            <span class="text-sm text-gray-400 font-medium">Редактор</span>
            <div class="flex items-center gap-1 bg-[#2e2e2e] rounded-lg p-1">
              <button @click="zoom = Math.max(3, zoom - 1)" class="w-7 h-7 flex items-center justify-center rounded hover:bg-[#404040] transition-colors">−</button>
              <span class="text-xs text-gray-300 w-10 text-center">{{ zoom }}×</span>
              <button @click="zoom = Math.min(15, zoom + 1)" class="w-7 h-7 flex items-center justify-center rounded hover:bg-[#404040] transition-colors">+</button>
            </div>
            <span class="text-xs text-gray-500">{{ selectedTemplate.width }}×{{ selectedTemplate.length }} мм · Тащите элементы мышью</span>

            <!-- Selected element controls -->
            <template v-if="selectedEl">
              <div class="ml-auto flex items-center gap-3 flex-wrap">
                <span class="text-xs text-gray-400 font-medium">{{ selectedEl.label }}:</span>
                <label class="flex items-center gap-1 text-xs text-gray-300">
                  X: <input type="number" step="0.5" v-model.number="selectedEl.x" class="input-sm w-16" @change="saveTemplate" /> мм
                </label>
                <label class="flex items-center gap-1 text-xs text-gray-300">
                  Y: <input type="number" step="0.5" v-model.number="selectedEl.y" class="input-sm w-16" @change="saveTemplate" /> мм
                </label>
                <template v-if="selectedEl.id !== 'barcode'">
                  <label class="flex items-center gap-1 text-xs text-gray-300">
                    Размер: <input type="number" min="4" max="72" v-model.number="selectedEl.fontSize" class="input-sm w-14" @change="saveTemplate" /> pt
                  </label>
                  <label class="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
                    <input type="checkbox" :checked="selectedEl.fontWeight === 'bold'" @change="toggleBold" class="accent-[#1f78ff]" />
                    Жирный
                  </label>
                </template>
                <template v-else>
                  <label class="flex items-center gap-1 text-xs text-gray-300">
                    Высота: <input type="number" min="3" max="40" v-model.number="selectedEl.barcodeHeight" class="input-sm w-14" @change="saveTemplate" /> мм
                  </label>
                </template>
              </div>
            </template>
          </div>

          <!-- Canvas -->
          <div class="flex-1 overflow-auto p-8 flex items-start justify-center">
            <div
              ref="canvasRef"
              class="relative border-2 border-dashed border-gray-400 bg-white shadow-2xl select-none"
              :style="{ width: tagW + 'px', height: tagH + 'px', minWidth: tagW + 'px', minHeight: tagH + 'px' }"
              @mousemove.prevent="onCanvasMouseMove"
              @mouseup="stopDrag"
              @mouseleave="stopDrag"
            >
              <!-- Grid -->
              <div class="absolute inset-0 pointer-events-none opacity-10" :style="gridStyle" />

              <!-- Draggable elements -->
              <div
                v-for="el in visibleElements"
                :key="el.id"
                class="absolute select-none"
                :class="[
                  dragging?.id === el.id ? 'cursor-grabbing' : 'cursor-grab',
                  selectedEl?.id === el.id ? 'ring-1 ring-blue-500 ring-offset-1 ring-offset-white' : '',
                ]"
                :style="{ left: el.x * zoom + 'px', top: el.y * zoom + 'px' }"
                @mousedown.prevent="startDrag($event, el)"
              >
                <!-- Name -->
                <span v-if="el.id === 'name'" :style="textStyle(el, 8)">{{ sampleProduct.name }}</span>
                <!-- Price -->
                <span v-else-if="el.id === 'price'" :style="textStyle(el, 14)">{{ formatPrice(sampleProduct.price) }} UZS</span>
                <!-- Barcode -->
                <div v-else-if="el.id === 'barcode'" style="display:flex;flex-direction:column;align-items:center;line-height:1;">
                  <span :style="barcodeStyle(el)">{{ sampleProduct.barcode || '000000000000' }}</span>
                  <span :style="{ fontSize: Math.max(6, (el.fontSize || 6) * zoom * 0.35) + 'px', color: '#111', fontFamily: 'monospace', marginTop: '1px' }">
                    {{ sampleProduct.barcode || '000000000000' }}
                  </span>
                </div>
                <!-- SKU -->
                <span v-else-if="el.id === 'sku'" :style="textStyle(el, 6)">Арт: {{ sampleProduct.sku }}</span>
                <!-- Shop -->
                <span v-else-if="el.id === 'shop'" :style="textStyle(el, 6)">{{ sampleProduct.shop }}</span>
                <!-- Discount -->
                <span v-else-if="el.id === 'discount'" :style="{ ...textStyle(el, 7), color: '#e00' }">Скидка: -10%</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Right: Preview panel -->
      <div class="w-60 flex-none border-l border-gray-700 overflow-y-auto p-4">
        <div class="mb-4">
          <span class="font-semibold text-sm text-gray-300">Предпросмотр</span>
        </div>

        <div v-if="selectedTemplate" class="space-y-4">
          <!-- Product info -->
          <div class="bg-[#2e2e2e] rounded-xl p-3 text-xs space-y-1.5">
            <div class="font-semibold text-white text-sm">{{ sampleProduct.name }}</div>
            <div class="text-gray-400">Арт: {{ sampleProduct.sku || '—' }}</div>
            <div class="text-gray-400">Баркод: {{ sampleProduct.barcode || '—' }}</div>
            <div class="text-gray-400">Цена: {{ formatPrice(sampleProduct.price) }} UZS</div>
            <div v-if="sampleProduct.shop" class="text-gray-400">Магазин: {{ sampleProduct.shop }}</div>
          </div>

          <!-- Scaled preview -->
          <div>
            <div class="text-xs text-gray-500 mb-2">{{ selectedTemplate.width }}×{{ selectedTemplate.length }} мм</div>
            <div
              class="relative bg-white border border-gray-400 overflow-hidden"
              :style="{ width: previewW + 'px', height: previewH + 'px' }"
            >
              <div
                v-for="el in visibleElements"
                :key="el.id"
                class="absolute overflow-hidden"
                :style="{ left: el.x * PREVIEW_PX_PER_MM + 'px', top: el.y * PREVIEW_PX_PER_MM + 'px' }"
              >
                <span v-if="el.id === 'name'" :style="previewTextStyle(el, 8)">{{ sampleProduct.name }}</span>
                <span v-else-if="el.id === 'price'" :style="previewTextStyle(el, 14)">{{ formatPrice(sampleProduct.price) }} UZS</span>
                <div v-else-if="el.id === 'barcode'" style="display:flex;flex-direction:column;align-items:center;line-height:1;">
                  <span :style="previewBarcodeStyle(el)">{{ sampleProduct.barcode || '000000000000' }}</span>
                  <span :style="{ fontSize: Math.max(4, (el.fontSize || 6) * PREVIEW_PX_PER_MM * 0.35) + 'px', color: '#111', fontFamily: 'monospace' }">
                    {{ sampleProduct.barcode || '000000000000' }}
                  </span>
                </div>
                <span v-else-if="el.id === 'sku'" :style="previewTextStyle(el, 6)">Арт: {{ sampleProduct.sku }}</span>
                <span v-else-if="el.id === 'shop'" :style="previewTextStyle(el, 6)">{{ sampleProduct.shop }}</span>
                <span v-else-if="el.id === 'discount' && showDiscount" :style="{ ...previewTextStyle(el, 7), color: '#e00' }">Скидка: -10%</span>
              </div>
            </div>
          </div>

          <div v-if="printCount > 1" class="text-xs text-gray-500">
            Будет напечатано: {{ printCount }} шт
          </div>
        </div>
      </div>
    </div>

    <!-- New template dialog -->
    <Teleport to="body">
      <div v-if="showNewDialog" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="showNewDialog = false">
        <div class="bg-[#2e2e2e] rounded-2xl p-6 w-80 shadow-2xl border border-gray-600">
          <h3 class="text-lg font-bold mb-4">Новый шаблон</h3>
          <label class="block mb-3">
            <span class="label">Название</span>
            <input v-model="newName" class="input" placeholder="Ценник 1" @keydown.enter="confirmCreate" />
          </label>
          <div class="flex gap-2 mb-3">
            <label class="block flex-1">
              <span class="label">Ширина (мм)</span>
              <input type="number" v-model.number="newWidth" class="input" />
            </label>
            <label class="block flex-1">
              <span class="label">Высота (мм)</span>
              <input type="number" v-model.number="newLength" class="input" />
            </label>
          </div>
          <label class="block mb-5">
            <span class="label">Тип штрих-кода</span>
            <select v-model="newBarcodeType" class="input">
              <option value="CODE128">CODE128</option>
              <option value="EAN13">EAN13</option>
              <option value="EAN8">EAN8</option>
            </select>
          </label>
          <div class="flex gap-3">
            <button class="btn-dark flex-1" @click="showNewDialog = false">Отмена</button>
            <button class="btn-primary flex-1" @click="confirmCreate" :disabled="!newName.trim()">Создать</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirm dialog -->
    <Teleport to="body">
      <div v-if="deleteTargetId" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="deleteTargetId = null">
        <div class="bg-[#2e2e2e] rounded-2xl p-6 w-80 shadow-2xl border border-gray-600">
          <h3 class="text-lg font-bold mb-2">Удалить шаблон?</h3>
          <p class="text-gray-400 text-sm mb-5">Это действие нельзя отменить.</p>
          <div class="flex gap-3">
            <button class="btn-dark flex-1" @click="deleteTargetId = null">Отмена</button>
            <button
              class="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              @click="confirmDelete"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useHead, definePageMeta } from "#imports";
import { useRouter, useRoute } from "#app";
import { useApi } from "~/composables/useApi";

useHead({
  title: "Печать ценников | Konkurent",
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Libre+Barcode+128&family=Libre+Barcode+EAN13+Text&display=swap",
    },
  ],
});

definePageMeta({ layout: "empty" });

const router = useRouter();
const route = useRoute();
const { apiFetch } = useApi();

// ─── Types ────────────────────────────────────────────────────────────────────
interface TagElement {
  id: string;
  label: string;
  x: number;
  y: number;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  visible: boolean;
  barcodeHeight?: number;
}

interface PriceTagTemplate {
  id: string;
  company_id: string;
  name: string;
  width: number;
  length: number;
  barcode_type: string;
  barcode_type_id: string;
  properties: { elements?: TagElement[] } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PREVIEW_PX_PER_MM = 3.0;
const BARCODE_FONT = "'Libre Barcode 128', monospace";

const DEFAULT_ELEMENTS: TagElement[] = [
  { id: "name",     label: "Наименование", x: 2, y: 2,  fontSize: 8,  fontWeight: "bold",   visible: true  },
  { id: "price",    label: "Цена",         x: 2, y: 10, fontSize: 14, fontWeight: "bold",   visible: true  },
  { id: "barcode",  label: "Штрих-код",    x: 2, y: 22, fontSize: 6,  barcodeHeight: 10,    visible: true  },
  { id: "sku",      label: "Артикул",      x: 2, y: 36, fontSize: 6,  fontWeight: "normal", visible: true  },
  { id: "shop",     label: "Магазин",      x: 2, y: 42, fontSize: 6,  fontWeight: "normal", visible: false },
  { id: "discount", label: "Скидка",       x: 2, y: 48, fontSize: 7,  fontWeight: "bold",   visible: false },
];

// ─── State ────────────────────────────────────────────────────────────────────
const loadingTemplates = ref(true);
const saving = ref(false);
const templates = ref<PriceTagTemplate[]>([]);
const selectedTemplate = ref<PriceTagTemplate | null>(null);
const elements = ref<TagElement[]>([]);
const selectedEl = ref<TagElement | null>(null);

const editName = ref("");
const editWidth = ref(40);
const editLength = ref(20);
const editBarcodeType = ref("CODE128");

const showNewDialog = ref(false);
const newName = ref("");
const newWidth = ref(40);
const newLength = ref(20);
const newBarcodeType = ref("CODE128");

const deleteTargetId = ref<string | null>(null);

const printCount = ref(Number(route.query.count) || 1);
const printOnA4 = ref(false);
const showDiscount = ref(false);

const zoom = ref(6);
const canvasRef = ref<HTMLElement | null>(null);

// Drag
const dragging = ref<TagElement | null>(null);
let dragStartMouseX = 0;
let dragStartMouseY = 0;
let dragStartElX = 0;
let dragStartElY = 0;

// ─── Computed ─────────────────────────────────────────────────────────────────
const sampleProduct = computed(() => ({
  name:    String(route.query.productName || "Наименование товара"),
  sku:     String(route.query.sku         || "АРТ-001"),
  barcode: String(route.query.barcode     || "123456789012"),
  price:   Number(route.query.price       || 59900),
  shop:    String(route.query.shop        || "Магазин"),
}));

const tagW = computed(() => (selectedTemplate.value?.width  ?? 40) * zoom.value);
const tagH = computed(() => (selectedTemplate.value?.length ?? 20) * zoom.value);

const previewW = computed(() => (selectedTemplate.value?.width  ?? 40) * PREVIEW_PX_PER_MM);
const previewH = computed(() => (selectedTemplate.value?.length ?? 20) * PREVIEW_PX_PER_MM);

const visibleElements = computed(() => elements.value.filter((e) => e.visible));

const gridStyle = computed(() => ({
  backgroundImage: [
    `repeating-linear-gradient(0deg, #aaa 0, #aaa 1px, transparent 1px, transparent ${zoom.value}px)`,
    `repeating-linear-gradient(90deg, #aaa 0, #aaa 1px, transparent 1px, transparent ${zoom.value}px)`,
  ].join(", "),
  backgroundSize: `${zoom.value}px ${zoom.value}px`,
}));

// ─── Style helpers ────────────────────────────────────────────────────────────
function textStyle(el: TagElement, defaultSize: number): Record<string, string> {
  return {
    display: "block",
    fontSize: Math.max(6, (el.fontSize ?? defaultSize) * zoom.value * 0.35) + "px",
    fontWeight: el.fontWeight ?? "normal",
    color: "#111",
    whiteSpace: "nowrap",
  };
}

function barcodeStyle(el: TagElement): Record<string, string> {
  return {
    display: "block",
    fontFamily: BARCODE_FONT,
    fontSize: (el.barcodeHeight ?? 10) * zoom.value + "px",
    color: "#111",
    lineHeight: "1",
    letterSpacing: "0",
  };
}

function previewTextStyle(el: TagElement, defaultSize: number): Record<string, string> {
  return {
    display: "block",
    fontSize: Math.max(4, (el.fontSize ?? defaultSize) * PREVIEW_PX_PER_MM * 0.35) + "px",
    fontWeight: el.fontWeight ?? "normal",
    color: "#111",
    whiteSpace: "nowrap",
  };
}

function previewBarcodeStyle(el: TagElement): Record<string, string> {
  return {
    display: "block",
    fontFamily: BARCODE_FONT,
    fontSize: (el.barcodeHeight ?? 10) * PREVIEW_PX_PER_MM + "px",
    color: "#111",
    lineHeight: "1",
    letterSpacing: "0",
  };
}

// ─── Drag ─────────────────────────────────────────────────────────────────────
function startDrag(e: MouseEvent, el: TagElement) {
  selectedEl.value = el;
  dragging.value = el;
  dragStartMouseX = e.clientX;
  dragStartMouseY = e.clientY;
  dragStartElX = el.x;
  dragStartElY = el.y;
}

function onCanvasMouseMove(e: MouseEvent) {
  if (!dragging.value || !selectedTemplate.value) return;
  const dx = (e.clientX - dragStartMouseX) / zoom.value;
  const dy = (e.clientY - dragStartMouseY) / zoom.value;
  const w = selectedTemplate.value.width;
  const h = selectedTemplate.value.length;
  dragging.value.x = Math.max(0, Math.min(w - 1, +(dragStartElX + dx).toFixed(1)));
  dragging.value.y = Math.max(0, Math.min(h - 1, +(dragStartElY + dy).toFixed(1)));
}

function stopDrag() {
  if (dragging.value) saveTemplate();
  dragging.value = null;
}

function toggleBold(e: Event) {
  if (!selectedEl.value) return;
  selectedEl.value.fontWeight = (e.target as HTMLInputElement).checked ? "bold" : "normal";
  saveTemplate();
}

// ─── Format ───────────────────────────────────────────────────────────────────
function formatPrice(value: number) {
  return Math.round(value).toLocaleString("ru-RU");
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function loadTemplates() {
  loadingTemplates.value = true;
  try {
    const res = await apiFetch<{ price_tags: PriceTagTemplate[] }>("/v1/price-tag");
    templates.value = res?.price_tags ?? [];
    if (templates.value.length) selectTemplate(templates.value[0]);
  } catch (e) {
    console.error("loadTemplates", e);
  } finally {
    loadingTemplates.value = false;
  }
}

function selectTemplate(tpl: PriceTagTemplate) {
  selectedTemplate.value = tpl;
  editName.value = tpl.name;
  editWidth.value = tpl.width;
  editLength.value = tpl.length;
  editBarcodeType.value = tpl.barcode_type;
  selectedEl.value = null;

  const saved = tpl.properties?.elements;
  elements.value = Array.isArray(saved) && saved.length
    ? saved.map((e) => ({ ...e }))
    : DEFAULT_ELEMENTS.map((e) => ({ ...e }));
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function saveTemplate() {
  if (!selectedTemplate.value) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saving.value = true;
    try {
      const id = selectedTemplate.value!.id;
      const updated = await apiFetch<PriceTagTemplate>(`/v1/price-tag/${id}`, {
        method: "PUT",
        body: {
          name: editName.value,
          width: editWidth.value,
          length: editLength.value,
          barcode_type: editBarcodeType.value,
          properties: { elements: elements.value.map((e) => ({ ...e })) },
        },
      });
      const idx = templates.value.findIndex((t) => t.id === id);
      if (idx !== -1 && updated) {
        templates.value[idx] = { ...templates.value[idx], ...updated };
        selectedTemplate.value = templates.value[idx];
      }
    } catch (e) {
      console.error("saveTemplate", e);
    } finally {
      saving.value = false;
    }
  }, 600);
}

function createTemplate() {
  newName.value = `Ценник ${templates.value.length + 1}`;
  newWidth.value = 40;
  newLength.value = 20;
  newBarcodeType.value = "CODE128";
  showNewDialog.value = true;
}

async function confirmCreate() {
  if (!newName.value.trim()) return;
  try {
    const created = await apiFetch<PriceTagTemplate>("/v1/price-tag", {
      method: "POST",
      body: {
        name: newName.value.trim(),
        width: newWidth.value,
        length: newLength.value,
        barcode_type: newBarcodeType.value,
        properties: { elements: DEFAULT_ELEMENTS.map((e) => ({ ...e })) },
      },
    });
    if (created) {
      templates.value.unshift(created);
      selectTemplate(created);
    }
  } catch (e) {
    console.error("confirmCreate", e);
  } finally {
    showNewDialog.value = false;
  }
}

function deleteTemplate(id: string) {
  deleteTargetId.value = id;
}

async function confirmDelete() {
  if (!deleteTargetId.value) return;
  const id = deleteTargetId.value;
  try {
    await apiFetch(`/v1/price-tag/${id}`, { method: "DELETE" });
    templates.value = templates.value.filter((t) => t.id !== id);
    if (selectedTemplate.value?.id === id) {
      selectedTemplate.value = null;
      elements.value = [];
      if (templates.value.length) selectTemplate(templates.value[0]);
    }
  } catch (e) {
    console.error("confirmDelete", e);
  } finally {
    deleteTargetId.value = null;
  }
}

// ─── Print ────────────────────────────────────────────────────────────────────
function buildPrintHtml(count: number): string {
  if (!selectedTemplate.value) return "";
  const tpl = selectedTemplate.value;
  const p = sampleProduct.value;
  const els = elements.value.filter((e) => e.visible);
  const PX = 3.7795;
  const w = tpl.width;
  const h = tpl.length;

  function elHtml(el: TagElement): string {
    const s = `position:absolute;left:${el.x * PX}px;top:${el.y * PX}px;`;
    if (el.id === "name") {
      const fs = Math.round((el.fontSize ?? 8) * 0.35 * PX);
      return `<span style="${s}font-size:${fs}px;font-weight:${el.fontWeight ?? "bold"};color:#111;white-space:nowrap;">${p.name}</span>`;
    }
    if (el.id === "price") {
      const fs = Math.round((el.fontSize ?? 14) * 0.35 * PX);
      return `<span style="${s}font-size:${fs}px;font-weight:bold;color:#111;white-space:nowrap;">${formatPrice(p.price)} UZS</span>`;
    }
    if (el.id === "barcode") {
      const bh = Math.round((el.barcodeHeight ?? 10) * PX);
      const fs = Math.round((el.fontSize ?? 6) * 0.35 * PX);
      return `<div style="${s}display:flex;flex-direction:column;align-items:center;line-height:1;">
        <span style="font-family:'Libre Barcode 128',monospace;font-size:${bh}px;color:#111;letter-spacing:0;">${p.barcode || "000000000000"}</span>
        <span style="font-family:monospace;font-size:${fs}px;color:#111;">${p.barcode || "000000000000"}</span>
      </div>`;
    }
    if (el.id === "sku") {
      const fs = Math.round((el.fontSize ?? 6) * 0.35 * PX);
      return `<span style="${s}font-size:${fs}px;color:#555;white-space:nowrap;">Арт: ${p.sku}</span>`;
    }
    if (el.id === "shop") {
      const fs = Math.round((el.fontSize ?? 6) * 0.35 * PX);
      return `<span style="${s}font-size:${fs}px;color:#555;white-space:nowrap;">${p.shop}</span>`;
    }
    if (el.id === "discount" && showDiscount.value) {
      const fs = Math.round((el.fontSize ?? 7) * 0.35 * PX);
      return `<span style="${s}font-size:${fs}px;color:#e00;font-weight:bold;white-space:nowrap;">Скидка: -10%</span>`;
    }
    return "";
  }

  const tagStyle = `position:relative;width:${w * PX}px;height:${h * PX}px;overflow:hidden;border:1px solid #ccc;background:white;display:inline-block;margin:2px;`;
  const singleTag = `<div style="${tagStyle}">${els.map(elHtml).join("")}</div>`;
  const allTags = Array(count).fill(singleTag).join("");
  const body = printOnA4.value
    ? `<div style="width:210mm;padding:5mm;box-sizing:border-box;">${allTags}</div>`
    : allTags;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Ценники — ${tpl.name}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;}@page{margin:${printOnA4.value ? "10mm" : "2mm"}}</style>
</head>
<body>${body}</body>
</html>`;
}

function openPrint(html: string) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 900);
}

function printAll() {
  if (!selectedTemplate.value) return;
  openPrint(buildPrintHtml(printCount.value));
}

function printTest() {
  if (!selectedTemplate.value) return;
  openPrint(buildPrintHtml(1));
}

// ─── Init ─────────────────────────────────────────────────────────────────────
loadTemplates();
</script>

<style scoped>
@reference "tailwindcss";

.btn-dark {
  @apply bg-[#404040] px-4 py-2.5 text-sm font-semibold rounded-2xl transition-colors hover:bg-[#5e5e5e] cursor-pointer;
}
.btn-primary {
  @apply bg-[#1f78ff] px-4 py-2.5 text-sm font-semibold rounded-2xl transition-colors hover:bg-[#4d94ff] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed;
}
.input {
  @apply w-full px-3 py-2 border border-gray-600 rounded-lg bg-[#3a3a3a] text-white text-sm transition-all focus:border-[#1f78ff] focus:outline-none;
}
select.input {
  @apply cursor-pointer;
}
.input-sm {
  @apply px-2 py-1 border border-gray-600 rounded bg-[#3a3a3a] text-white text-xs focus:border-[#1f78ff] focus:outline-none;
}
.label {
  @apply block mb-1.5 text-xs font-medium text-gray-400;
}
.checkbox {
  @apply flex items-center gap-2 cursor-pointer;
}
</style>
