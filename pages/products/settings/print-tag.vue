<template>
  <section class="h-screen flex flex-col bg-[#141414] text-white overflow-hidden">

    <!-- Top bar -->
    <div class="flex-none border-b border-white/8 bg-[#1a1a1a]">
      <div class="flex items-center justify-between gap-4 px-6 py-4">
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-[#2a2a2a] hover:bg-[#333] transition-colors text-sm font-medium"
            @click="router.back()"
          >
            <Icon name="heroicons:chevron-left" class="w-4 h-4" />
            Назад
          </button>
          <div>
            <h1 class="text-[18px] font-bold leading-tight">Ценники</h1>
            <p class="text-[11px] text-[#666] leading-tight mt-0.5">Создание и печать шаблонов</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Transition name="fade">
            <span v-if="saving" class="text-[11px] text-[#666] mr-1">Сохранение...</span>
          </Transition>
          <button
            class="px-4 py-2 rounded-[14px] bg-[#2a2a2a] hover:bg-[#333] text-sm font-medium transition-colors"
            :disabled="!selectedTemplate"
            @click="printTest"
          >
            Тест
          </button>
          <button
            class="px-5 py-2 rounded-[14px] bg-[#1f78ff] hover:bg-[#3d8bff] text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="!selectedTemplate"
            @click="printAll"
          >
            Печатать{{ printCount > 1 ? ` (${printCount})` : '' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 flex overflow-hidden">

      <!-- ── Left: templates + settings ── -->
      <div class="w-64 flex-none flex flex-col border-r border-white/8 bg-[#191919]">

        <!-- Templates header -->
        <div class="flex items-center justify-between px-4 pt-4 pb-3">
          <span class="text-[13px] font-semibold text-[#aaa]">Шаблоны</span>
          <button
            class="flex items-center gap-1 text-[12px] text-[#1f78ff] hover:text-[#5a9eff] transition-colors font-medium"
            @click="createTemplate"
          >
            <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
            Новый
          </button>
        </div>

        <!-- Template list -->
        <div class="px-3 pb-3">
          <div v-if="loadingTemplates" class="text-center py-8 text-[12px] text-[#555]">
            <Icon name="heroicons:arrow-path" class="w-5 h-5 animate-spin mx-auto mb-2" />
            Загрузка...
          </div>
          <div v-else-if="!templates.length" class="text-center py-8 text-[12px] text-[#555]">
            <Icon name="heroicons:tag" class="w-8 h-8 mx-auto mb-2 opacity-30" />
            Нет шаблонов
          </div>
          <div v-else class="space-y-1">
            <div
              v-for="tpl in templates"
              :key="tpl.id"
              @click="selectTemplate(tpl)"
              class="group flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] cursor-pointer transition-all"
              :class="selectedTemplate?.id === tpl.id
                ? 'bg-[#1f78ff]/15 border border-[#1f78ff]/30'
                : 'hover:bg-white/5 border border-transparent'"
            >
              <div
                class="w-7 h-7 rounded-[8px] flex-none flex items-center justify-center"
                :class="selectedTemplate?.id === tpl.id ? 'bg-[#1f78ff]/20' : 'bg-white/5'"
              >
                <Icon name="heroicons:tag" class="w-3.5 h-3.5" :class="selectedTemplate?.id === tpl.id ? 'text-[#1f78ff]' : 'text-[#666]'" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-[13px] font-medium truncate" :class="selectedTemplate?.id === tpl.id ? 'text-white' : 'text-[#ccc]'">{{ tpl.name }}</div>
                <div class="text-[10px] text-[#555] mt-0.5">{{ tpl.width }}×{{ tpl.length }} мм</div>
              </div>
              <button
                @click.stop="deleteTemplate(tpl.id)"
                class="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 text-[#666] transition-all"
              >
                <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div v-if="selectedTemplate" class="h-px bg-white/8 mx-3" />

        <!-- Settings -->
        <div v-if="selectedTemplate" class="flex-1 overflow-y-auto px-4 py-4 space-y-5">

          <!-- Template name & size -->
          <div class="space-y-3">
            <p class="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Настройки</p>
            <div>
              <span class="label">Название</span>
              <input v-model="editName" class="input" @blur="saveTemplate" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="label">Ширина мм</span>
                <input type="number" min="10" v-model.number="editWidth" class="input" @blur="saveTemplate" />
              </div>
              <div>
                <span class="label">Высота мм</span>
                <input type="number" min="10" v-model.number="editLength" class="input" @blur="saveTemplate" />
              </div>
            </div>
            <div>
              <span class="label">Штрих-код</span>
              <select v-model="editBarcodeType" class="input" @change="saveTemplate">
                <option value="CODE128">CODE128</option>
                <option value="EAN13">EAN13</option>
                <option value="EAN8">EAN8</option>
                <option value="UPC">UPC-A</option>
              </select>
            </div>
          </div>

          <!-- Elements -->
          <div class="space-y-2">
            <p class="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Элементы</p>
            <div class="space-y-0.5">
              <div
                v-for="el in elements"
                :key="el.id"
                class="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] cursor-pointer transition-colors"
                :class="selectedEl?.id === el.id ? 'bg-white/8' : 'hover:bg-white/4'"
                @click="selectedEl = el"
              >
                <input
                  type="checkbox"
                  v-model="el.visible"
                  class="w-3.5 h-3.5 accent-[#1f78ff] flex-none"
                  @click.stop
                  @change="saveTemplate"
                />
                <span class="text-[12px] flex-1" :class="el.visible ? 'text-[#ccc]' : 'text-[#555]'">{{ el.label }}</span>
                <span v-if="selectedEl?.id === el.id" class="w-1.5 h-1.5 rounded-full bg-[#1f78ff] flex-none" />
              </div>
            </div>
          </div>

          <!-- Print options -->
          <div class="space-y-2">
            <p class="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Печать</p>
            <div>
              <span class="label">Количество копий</span>
              <input type="number" min="1" max="999" v-model.number="printCount" class="input" />
            </div>
            <label class="flex items-center gap-2 cursor-pointer py-1">
              <input type="checkbox" v-model="printOnA4" class="w-3.5 h-3.5 accent-[#1f78ff]" />
              <span class="text-[12px] text-[#aaa]">Формат A4</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer py-1">
              <input type="checkbox" v-model="showDiscount" class="w-3.5 h-3.5 accent-[#1f78ff]" />
              <span class="text-[12px] text-[#aaa]">Показать скидку</span>
            </label>
          </div>
        </div>
      </div>

      <!-- ── Center: editor ── -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#141414]">

        <!-- Empty state -->
        <div v-if="!selectedTemplate" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Icon name="heroicons:tag" class="w-8 h-8 text-[#444]" />
            </div>
            <p class="text-[#555] text-sm">Выберите шаблон или создайте новый</p>
          </div>
        </div>

        <template v-else>
          <!-- Toolbar -->
          <div class="flex items-center gap-3 px-5 py-3 border-b border-white/8 flex-none flex-wrap bg-[#191919]">
            <!-- Zoom -->
            <div class="flex items-center gap-0.5 bg-[#242424] rounded-[10px] p-0.5">
              <button
                @click="zoom = Math.max(3, zoom - 1)"
                class="w-7 h-7 flex items-center justify-center rounded-[8px] hover:bg-white/10 transition-colors text-[#aaa] text-sm"
              >−</button>
              <span class="text-[12px] text-[#888] w-8 text-center font-mono">{{ zoom }}×</span>
              <button
                @click="zoom = Math.min(15, zoom + 1)"
                class="w-7 h-7 flex items-center justify-center rounded-[8px] hover:bg-white/10 transition-colors text-[#aaa] text-sm"
              >+</button>
            </div>

            <span class="text-[11px] text-[#444]">{{ selectedTemplate.width }}×{{ selectedTemplate.length }} мм</span>

            <!-- Selected element controls -->
            <template v-if="selectedEl">
              <div class="h-4 w-px bg-white/10" />
              <span class="text-[12px] text-[#888] font-medium">{{ selectedEl.label }}</span>

              <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                X
                <input type="number" step="0.5" v-model.number="selectedEl.x" class="input-sm w-14" @change="saveTemplate" />
                мм
              </label>
              <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                Y
                <input type="number" step="0.5" v-model.number="selectedEl.y" class="input-sm w-14" @change="saveTemplate" />
                мм
              </label>

              <template v-if="selectedEl.id !== 'barcode'">
                <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                  Размер
                  <input type="number" min="4" max="72" v-model.number="selectedEl.fontSize" class="input-sm w-12" @change="saveTemplate" />
                  pt
                </label>
                <label class="flex items-center gap-1.5 text-[11px] text-[#777] cursor-pointer">
                  <input type="checkbox" :checked="selectedEl.fontWeight === 'bold'" @change="toggleBold" class="w-3 h-3 accent-[#1f78ff]" />
                  Жирный
                </label>
              </template>
              <template v-else>
                <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                  Высота
                  <input type="number" min="3" max="40" v-model.number="selectedEl.barcodeHeight" class="input-sm w-12" @change="saveTemplate" />
                  мм
                </label>
              </template>
            </template>

            <span v-else class="text-[11px] text-[#444] ml-1">Кликните на элемент для редактирования</span>
          </div>

          <!-- Canvas area -->
          <div class="flex-1 overflow-auto p-10 flex items-start justify-center">
            <div
              ref="canvasRef"
              class="relative bg-white shadow-2xl select-none"
              style="border: 2px dashed #d0d0d0;"
              :style="{
                width: tagW + 'px',
                height: tagH + 'px',
                minWidth: tagW + 'px',
                minHeight: tagH + 'px',
              }"
              @mousemove.prevent="onCanvasMouseMove"
              @mouseup="stopDrag"
              @mouseleave="stopDrag"
            >
              <!-- Grid -->
              <div class="absolute inset-0 pointer-events-none opacity-[0.08]" :style="gridStyle" />

              <!-- Elements -->
              <div
                v-for="el in visibleElements"
                :key="el.id"
                class="absolute select-none"
                :class="[
                  dragging?.id === el.id ? 'cursor-grabbing' : 'cursor-grab',
                ]"
                :style="{
                  left: el.x * zoom + 'px',
                  top: el.y * zoom + 'px',
                  outline: selectedEl?.id === el.id ? '1.5px solid #1f78ff' : 'none',
                  outlineOffset: '2px',
                }"
                @mousedown.prevent="startDrag($event, el)"
              >
                <span v-if="el.id === 'name'" :style="textStyle(el, 8)">{{ sampleProduct.name }}</span>
                <span v-else-if="el.id === 'price'" :style="textStyle(el, 14)">{{ formatPrice(sampleProduct.price) }} UZS</span>
                <div v-else-if="el.id === 'barcode'" style="display:flex;flex-direction:column;align-items:center;line-height:1;">
                  <span :style="barcodeStyle(el)">{{ sampleProduct.barcode || '000000000000' }}</span>
                  <span :style="{ fontSize: Math.max(6, (el.fontSize || 6) * zoom * 0.35) + 'px', color: '#111', fontFamily: 'monospace', marginTop: '1px' }">
                    {{ sampleProduct.barcode || '000000000000' }}
                  </span>
                </div>
                <span v-else-if="el.id === 'sku'" :style="textStyle(el, 6)">Арт: {{ sampleProduct.sku }}</span>
                <span v-else-if="el.id === 'shop'" :style="textStyle(el, 6)">{{ sampleProduct.shop }}</span>
                <span v-else-if="el.id === 'discount'" :style="{ ...textStyle(el, 7), color: '#e00' }">Скидка: -10%</span>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ── Right: preview ── -->
      <div class="w-56 flex-none border-l border-white/8 bg-[#191919] flex flex-col">
        <div class="px-4 pt-4 pb-3">
          <span class="text-[13px] font-semibold text-[#aaa]">Предпросмотр</span>
        </div>

        <div v-if="selectedTemplate" class="px-4 pb-4 space-y-4 flex-1 overflow-y-auto">
          <!-- Info card -->
          <div class="bg-[#222] rounded-[14px] p-3 space-y-1.5 border border-white/5">
            <div class="text-[13px] font-semibold text-white truncate">{{ sampleProduct.name }}</div>
            <div class="text-[11px] text-[#666]">Арт: {{ sampleProduct.sku || '—' }}</div>
            <div class="text-[11px] text-[#666]">{{ sampleProduct.barcode || '—' }}</div>
            <div class="text-[12px] font-semibold text-[#1f78ff] mt-1">{{ formatPrice(sampleProduct.price) }} UZS</div>
          </div>

          <!-- Scaled preview -->
          <div>
            <div class="text-[11px] text-[#555] mb-2">{{ selectedTemplate.width }}×{{ selectedTemplate.length }} мм</div>
            <div
              class="relative bg-white overflow-hidden border border-[#ddd]"
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

          <div v-if="printCount > 1" class="text-[11px] text-[#555]">
            Будет напечатано: <span class="text-white font-semibold">{{ printCount }} шт</span>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center">
          <p class="text-[12px] text-[#444] text-center px-4">Выберите шаблон для предпросмотра</p>
        </div>
      </div>
    </div>

    <!-- ── New template dialog ── -->
    <Teleport to="body">
      <Transition name="dialog">
        <div
          v-if="showNewDialog"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          @click.self="showNewDialog = false"
        >
          <div class="bg-[#222] rounded-[24px] p-6 w-[340px] shadow-2xl border border-white/10">
            <h3 class="text-[17px] font-bold mb-1">Новый шаблон</h3>
            <p class="text-[12px] text-[#666] mb-5">Заполните параметры ценника</p>

            <div class="space-y-3">
              <div>
                <span class="label">Название</span>
                <input v-model="newName" class="input" placeholder="Ценник 1" @keydown.enter="confirmCreate" autofocus />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <span class="label">Ширина мм</span>
                  <input type="number" v-model.number="newWidth" class="input" />
                </div>
                <div>
                  <span class="label">Высота мм</span>
                  <input type="number" v-model.number="newLength" class="input" />
                </div>
              </div>
              <div>
                <span class="label">Тип штрих-кода</span>
                <select v-model="newBarcodeType" class="input">
                  <option value="CODE128">CODE128</option>
                  <option value="EAN13">EAN13</option>
                  <option value="EAN8">EAN8</option>
                </select>
              </div>
            </div>

            <div class="flex gap-2 mt-6">
              <button
                class="flex-1 px-4 py-2.5 rounded-[14px] bg-white/8 hover:bg-white/12 text-sm font-medium transition-colors"
                @click="showNewDialog = false"
              >Отмена</button>
              <button
                class="flex-1 px-4 py-2.5 rounded-[14px] bg-[#1f78ff] hover:bg-[#3d8bff] text-sm font-semibold transition-colors disabled:opacity-40"
                :disabled="!newName.trim()"
                @click="confirmCreate"
              >Создать</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete confirm dialog ── -->
    <Teleport to="body">
      <Transition name="dialog">
        <div
          v-if="deleteTargetId"
          class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          @click.self="deleteTargetId = null"
        >
          <div class="bg-[#222] rounded-[24px] p-6 w-[320px] shadow-2xl border border-white/10">
            <div class="w-10 h-10 rounded-[12px] bg-red-500/15 flex items-center justify-center mb-4">
              <Icon name="heroicons:trash" class="w-5 h-5 text-red-400" />
            </div>
            <h3 class="text-[17px] font-bold mb-1">Удалить шаблон?</h3>
            <p class="text-[13px] text-[#666] mb-6">Это действие нельзя отменить.</p>
            <div class="flex gap-2">
              <button
                class="flex-1 px-4 py-2.5 rounded-[14px] bg-white/8 hover:bg-white/12 text-sm font-medium transition-colors"
                @click="deleteTargetId = null"
              >Отмена</button>
              <button
                class="flex-1 px-4 py-2.5 rounded-[14px] bg-red-600 hover:bg-red-500 text-sm font-semibold transition-colors"
                @click="confirmDelete"
              >Удалить</button>
            </div>
          </div>
        </div>
      </Transition>
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

function mergeElements(saved: TagElement[]): TagElement[] {
  const merged: TagElement[] = [];
  const usedIds = new Set<string>();
  for (const s of saved) {
    const def = DEFAULT_ELEMENTS.find((d) => d.id === s.id);
    merged.push({
      id: s.id,
      label: def?.label ?? s.label,
      x: s.x ?? def?.x ?? 2,
      y: s.y ?? def?.y ?? 2,
      fontSize: s.fontSize ?? def?.fontSize,
      fontWeight: s.fontWeight ?? def?.fontWeight,
      visible: s.visible ?? def?.visible ?? true,
      barcodeHeight: s.barcodeHeight ?? def?.barcodeHeight,
    });
    usedIds.add(s.id);
  }
  for (const d of DEFAULT_ELEMENTS) {
    if (!usedIds.has(d.id)) merged.push({ ...d });
  }
  return merged;
}

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

const tagW = computed(() => (editWidth.value  || 40) * zoom.value);
const tagH = computed(() => (editLength.value || 20) * zoom.value);
const previewW = computed(() => (editWidth.value  || 40) * PREVIEW_PX_PER_MM);
const previewH = computed(() => (editLength.value || 20) * PREVIEW_PX_PER_MM);
const visibleElements = computed(() => elements.value.filter((e) => e.visible));

const gridStyle = computed(() => ({
  backgroundImage: [
    `repeating-linear-gradient(0deg, #888 0, #888 1px, transparent 1px, transparent ${zoom.value}px)`,
    `repeating-linear-gradient(90deg, #888 0, #888 1px, transparent 1px, transparent ${zoom.value}px)`,
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
  const w = editWidth.value || selectedTemplate.value.width;
  const h = editLength.value || selectedTemplate.value.length;
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

function formatPrice(value: number) {
  return Math.round(value).toLocaleString("ru-RU");
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function loadTemplates() {
  loadingTemplates.value = true;
  try {
    const res = await apiFetch<{ price_tags: PriceTagTemplate[] }>("/price-tag");
    templates.value = res?.price_tags ?? [];
    if (templates.value.length) selectTemplate(templates.value[0]);
  } catch (e) {
    console.error("loadTemplates", e);
  } finally {
    loadingTemplates.value = false;
  }
}

async function selectTemplate(tpl: PriceTagTemplate) {
  await flushPendingSave();
  selectedTemplate.value = tpl;
  editName.value = tpl.name;
  editWidth.value = tpl.width;
  editLength.value = tpl.length;
  editBarcodeType.value = tpl.barcode_type;
  selectedEl.value = null;
  const saved = tpl.properties?.elements;
  elements.value = Array.isArray(saved) && saved.length
    ? mergeElements(saved)
    : DEFAULT_ELEMENTS.map((e) => ({ ...e }));
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function currentEditPayload() {
  return {
    name: editName.value,
    width: editWidth.value,
    length: editLength.value,
    barcode_type: editBarcodeType.value,
    properties: { elements: elements.value.map((e) => ({ ...e })) },
  };
}

async function persistTemplate(id: string, payload: ReturnType<typeof currentEditPayload>) {
  saving.value = true;
  try {
    const updated = await apiFetch<PriceTagTemplate>(`/price-tag/${id}`, {
      method: "PUT",
      body: payload,
    });
    const idx = templates.value.findIndex((t) => t.id === id);
    if (idx !== -1 && updated) {
      templates.value[idx] = { ...templates.value[idx], ...updated };
      if (selectedTemplate.value?.id === id) selectedTemplate.value = templates.value[idx];
    }
  } catch (e) {
    console.error("saveTemplate", e);
  } finally {
    saving.value = false;
  }
}

async function flushPendingSave() {
  if (!saveTimer || !selectedTemplate.value) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  await persistTemplate(selectedTemplate.value.id, currentEditPayload());
}

function saveTemplate() {
  if (!selectedTemplate.value) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (!selectedTemplate.value) return;
    void persistTemplate(selectedTemplate.value.id, currentEditPayload());
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
    const created = await apiFetch<PriceTagTemplate>("/price-tag", {
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
    await apiFetch(`/price-tag/${id}`, { method: "DELETE" });
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

  const tagStyle = `position:relative;width:${w * PX}px;height:${h * PX}px;overflow:hidden;background:white;display:inline-block;margin:2px;page-break-inside:avoid;`;
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

loadTemplates();
</script>

<style scoped>
.input {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.10);
  background: #2a2a2a;
  color: #fff;
  font-size: 13px;
  transition: border-color 0.15s;
  outline: none;
}
.input:focus { border-color: #1f78ff; }
select.input { cursor: pointer; }

.input-sm {
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.10);
  background: #2a2a2a;
  color: #fff;
  font-size: 12px;
  outline: none;
}
.input-sm:focus { border-color: #1f78ff; }

.label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #666;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.dialog-enter-active, .dialog-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; transform: scale(0.96); }
</style>
