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
          <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
            Копий
            <input type="number" min="1" max="999" v-model.number="printCount" class="input-sm w-14" />
          </label>
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
                <div class="flex items-center gap-1.5 text-[13px] font-medium truncate" :class="selectedTemplate?.id === tpl.id ? 'text-white' : 'text-[#ccc]'">
                  <span class="truncate">{{ tpl.name }}</span>
                  <span v-if="tpl.isDefault" class="flex-none rounded-[6px] bg-[#1f78ff]/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#5a9eff]">По умолчанию</span>
                </div>
                <div class="text-[10px] text-[#555] mt-0.5">{{ tpl.width }}×{{ tpl.length }} мм</div>
              </div>
              <button
                v-if="!tpl.isDefault"
                type="button"
                title="Сделать шаблоном по умолчанию для печати"
                @click.stop="markAsDefault(tpl)"
                class="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-[#5a9eff] text-[#666] transition-all"
              >
                <Icon name="heroicons:star" class="w-3.5 h-3.5" />
              </button>
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
                <option v-for="bt in BARCODE_TYPES" :key="bt" :value="bt">{{ bt }}</option>
              </select>
            </div>
          </div>

          <!-- Elements -->
          <div class="space-y-2">
            <div class="flex items-center justify-between relative">
              <p class="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Свойства</p>
              <button
                type="button"
                class="flex items-center gap-1 text-[11px] text-[#1f78ff] hover:text-[#5a9eff] transition-colors font-medium"
                @click="showAddMenu = !showAddMenu"
              >
                <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
                Добавить
              </button>
              <div
                v-if="showAddMenu"
                class="absolute right-0 top-6 z-10 w-44 rounded-[12px] bg-[#242424] border border-white/10 shadow-xl py-1"
              >
                <button
                  v-for="preset in availablePresets"
                  :key="preset.name"
                  type="button"
                  class="w-full text-left px-3 py-2 text-[12px] text-[#ccc] hover:bg-white/5 transition-colors"
                  @click="addElement(preset)"
                >{{ ELEMENT_LABELS[preset.name] }}</button>
                <p v-if="!availablePresets.length" class="px-3 py-2 text-[11px] text-[#555]">Все свойства добавлены</p>
              </div>
            </div>
            <div v-if="!elements.length" class="text-center py-6 text-[11px] text-[#555]">
              Добавьте свойства для отображения
            </div>
            <div v-else class="space-y-0.5">
              <div
                v-for="el in elements"
                :key="el.id"
                class="group flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] cursor-pointer transition-colors"
                :class="selectedEl?.id === el.id ? 'bg-white/8' : 'hover:bg-white/4'"
                @click="selectedEl = el"
              >
                <span class="text-[12px] flex-1 text-[#ccc]">{{ ELEMENT_LABELS[el.name] }}</span>
                <button
                  type="button"
                  class="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 text-[#666] transition-all"
                  @click.stop="removeElement(el)"
                >
                  <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
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
                @click="zoom = Math.max(1, +(zoom - 0.5).toFixed(1))"
                class="w-7 h-7 flex items-center justify-center rounded-[8px] hover:bg-white/10 transition-colors text-[#aaa] text-sm"
              >−</button>
              <span class="text-[12px] text-[#888] w-8 text-center font-mono">{{ zoom }}×</span>
              <button
                @click="zoom = Math.min(8, +(zoom + 0.5).toFixed(1))"
                class="w-7 h-7 flex items-center justify-center rounded-[8px] hover:bg-white/10 transition-colors text-[#aaa] text-sm"
              >+</button>
            </div>

            <span class="text-[11px] text-[#444]">{{ editWidth }}×{{ editLength }} мм</span>

            <!-- Selected element controls -->
            <template v-if="selectedEl">
              <div class="h-4 w-px bg-white/10" />
              <span class="text-[12px] text-[#888] font-medium">{{ ELEMENT_LABELS[selectedEl.name] }}</span>

              <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                X
                <input type="number" step="0.5" v-model.number="selectedEl.xAxis" class="input-sm w-14" @change="saveTemplate" />
                мм
              </label>
              <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                Y
                <input type="number" step="0.5" v-model.number="selectedEl.yAxis" class="input-sm w-14" @change="saveTemplate" />
                мм
              </label>
              <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                Ширина
                <input type="number" step="0.5" min="2" v-model.number="selectedEl.width" class="input-sm w-14" @change="saveTemplate" />
                мм
              </label>

              <template v-if="selectedEl.type === 'text'">
                <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                  Размер
                  <input type="number" min="4" max="72" v-model.number="selectedEl.fontSize" class="input-sm w-12" @change="saveTemplate" />
                  pt
                </label>
                <div class="flex items-center gap-0.5 bg-[#242424] rounded-[8px] p-0.5">
                  <button
                    type="button"
                    class="w-6 h-6 rounded-[6px] text-[11px] font-bold transition-colors"
                    :class="selectedEl.isBold ? 'bg-[#1f78ff] text-white' : 'text-[#888] hover:bg-white/10'"
                    @click="toggleStyle('isBold')"
                  >B</button>
                  <button
                    type="button"
                    class="w-6 h-6 rounded-[6px] text-[11px] italic transition-colors"
                    :class="selectedEl.isItalic ? 'bg-[#1f78ff] text-white' : 'text-[#888] hover:bg-white/10'"
                    @click="toggleStyle('isItalic')"
                  >I</button>
                  <button
                    type="button"
                    class="w-6 h-6 rounded-[6px] text-[11px] underline transition-colors"
                    :class="selectedEl.isUnderlined ? 'bg-[#1f78ff] text-white' : 'text-[#888] hover:bg-white/10'"
                    @click="toggleStyle('isUnderlined')"
                  >U</button>
                  <button
                    type="button"
                    class="w-6 h-6 rounded-[6px] text-[11px] line-through transition-colors"
                    :class="selectedEl.isLineThrough ? 'bg-[#1f78ff] text-white' : 'text-[#888] hover:bg-white/10'"
                    @click="toggleStyle('isLineThrough')"
                  >S</button>
                </div>
                <div class="flex items-center gap-0.5 bg-[#242424] rounded-[8px] p-0.5">
                  <button
                    v-for="a in (['LEFT', 'CENTER', 'RIGHT'] as const)"
                    :key="a"
                    type="button"
                    class="w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors"
                    :class="selectedEl.alignmentType === a ? 'bg-[#1f78ff] text-white' : 'text-[#888] hover:bg-white/10'"
                    @click="setAlignment(a)"
                  >
                    <Icon :name="a === 'LEFT' ? 'heroicons:bars-3-bottom-left' : a === 'CENTER' ? 'heroicons:bars-3' : 'heroicons:bars-3-bottom-right'" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </template>
              <template v-else>
                <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                  Высота
                  <input type="number" min="3" max="40" v-model.number="selectedEl.length" class="input-sm w-12" @change="saveTemplate" />
                  мм
                </label>
              </template>

              <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                Поворот
                <input type="number" step="90" v-model.number="selectedEl.rotation" class="input-sm w-12" @change="saveTemplate" />
                °
              </label>
            </template>

            <span v-else class="text-[11px] text-[#444] ml-1">Кликните на элемент для редактирования</span>
          </div>

          <!-- Canvas area -->
          <div class="flex-1 overflow-auto p-10 flex items-start justify-center">
            <div
              class="relative bg-white shadow-2xl select-none"
              style="border: 2px dashed #d0d0d0;"
              :style="{
                width: tagW + 'px',
                height: tagH + 'px',
                minWidth: tagW + 'px',
                minHeight: tagH + 'px',
              }"
            >
              <!-- Real mm-sized tag, magnified via transform so every element
                   uses the exact same mm/pt units the actual print does —
                   editing here is guaranteed to match print 1:1. -->
              <div
                ref="canvasRef"
                class="absolute top-0 left-0"
                :style="{
                  width: editWidth + 'mm',
                  height: editLength + 'mm',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }"
                @mousemove.prevent="onCanvasMouseMove"
                @mouseup="stopDrag"
                @mouseleave="stopDrag"
              >
                <!-- Grid -->
                <div class="absolute inset-0 pointer-events-none opacity-[0.08]" :style="gridStyle" />

                <!-- Empty state -->
                <div v-if="!elements.length" class="absolute inset-0 flex items-center justify-center pointer-events-none px-2">
                  <p class="text-[8px] text-[#999] text-center leading-tight">Добавьте свойства для отображения</p>
                </div>

                <!-- Elements -->
                <div
                  v-for="el in visibleElements"
                  :key="el.id"
                  class="absolute select-none"
                  :class="[
                    dragging?.id === el.id ? 'cursor-grabbing' : 'cursor-grab',
                  ]"
                  :style="{
                    left: el.xAxis + 'mm',
                    top: el.yAxis + 'mm',
                    outline: selectedEl?.id === el.id ? (0.5 / zoom) + 'mm solid #1f78ff' : 'none',
                    outlineOffset: (0.5 / zoom) + 'mm',
                  }"
                  @mousedown.prevent="startDrag($event, el)"
                >
                  <span v-if="el.type === 'text'" :style="elementTextStyle(el)">{{ sampleText(el) }}</span>
                  <template v-else>
                    <div class="price-tag-barcode" :style="{ width: el.width + 'mm', height: el.length + 'mm' }" v-html="elementBarcodeSvg(el)" />
                    <div class="price-tag-barcode-value" :style="{ width: el.width + 'mm' }">{{ sampleProduct.barcode || "123456789012" }}</div>
                  </template>
                </div>
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

          <!-- Scaled preview — same mm/pt units + transform:scale as the
               canvas and the actual print, just at a fixed small zoom. -->
          <div>
            <div class="text-[11px] text-[#555] mb-2">{{ editWidth }}×{{ editLength }} мм</div>
            <div
              class="relative bg-white overflow-hidden border border-[#ddd]"
              :style="{ width: previewW + 'px', height: previewH + 'px' }"
            >
              <div
                :style="{
                  width: editWidth + 'mm',
                  height: editLength + 'mm',
                  transform: `scale(${PREVIEW_ZOOM})`,
                  transformOrigin: 'top left',
                  position: 'relative',
                }"
              >
                <div
                  v-for="el in visibleElements"
                  :key="el.id"
                  class="absolute overflow-hidden"
                  :style="{ left: el.xAxis + 'mm', top: el.yAxis + 'mm', width: el.width + 'mm' }"
                >
                  <span v-if="el.type === 'text'" :style="elementTextStyle(el)">{{ sampleText(el) }}</span>
                  <div v-else v-html="elementBarcodeSvg(el)" />
                </div>
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
                <input v-model="newName" class="input" placeholder="Введите название" @keydown.enter="confirmCreate" autofocus />
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
                  <option v-for="bt in BARCODE_TYPES" :key="bt" :value="bt">{{ bt }}</option>
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
import {
  usePriceTagsData,
  ELEMENT_LABELS,
  ELEMENT_PRESETS,
  BARCODE_TYPES,
  type PriceTagElement,
  type PriceTagTemplate,
  type PriceTagAlignment,
} from "@/composables/usePriceTagsData";
import { renderBarcodeSvg, type BarcodeFormat } from "@/utils/barcode";

useHead({ title: "Печать ценников | Konkurent" });
definePageMeta({ layout: "empty" });

const router = useRouter();
const route = useRoute();
const toast = useToast();
const {
  fetchPriceTagTemplateList,
  createPriceTagTemplate,
  updatePriceTagTemplate,
  deletePriceTagTemplate,
} = usePriceTagsData();

// ─── Constants ────────────────────────────────────────────────────────────────
// The real, spec-accurate CSS mm-to-px ratio (96dpi "reference pixel" — what
// every browser actually uses to lay out `mm`-unit lengths). All three
// renderings below (canvas, side preview, print HTML) use plain CSS `mm`/`pt`
// units directly and only reach for this constant where a raw pixel number is
// unavoidable (jsbarcode's height option) — that's what keeps them identical
// to each other and to the real print output.
const CSS_PX_PER_MM = 3.7795275591;
const PREVIEW_ZOOM = 3;

// ─── State ────────────────────────────────────────────────────────────────────
const loadingTemplates = ref(true);
const saving = ref(false);
const templates = ref<PriceTagTemplate[]>([]);
const selectedTemplate = ref<PriceTagTemplate | null>(null);
const elements = ref<PriceTagElement[]>([]);
const selectedEl = ref<PriceTagElement | null>(null);

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
const showAddMenu = ref(false);

const printCount = ref(Number(route.query.count) || 1);

const zoom = ref(2);
const canvasRef = ref<HTMLElement | null>(null);

const dragging = ref<PriceTagElement | null>(null);
let dragStartMouseX = 0;
let dragStartMouseY = 0;
let dragStartElX = 0;
let dragStartElY = 0;

// ─── Computed ─────────────────────────────────────────────────────────────────
const sampleProduct = computed(() => ({
  name: String(route.query.productName || "Наименование товара"),
  sku: String(route.query.sku || "АРТ-001"),
  barcode: String(route.query.barcode || "123456789012"),
  price: Number(route.query.price || 59900),
  shop: String(route.query.shop || "Магазин"),
}));

const tagW = computed(() => (editWidth.value || 40) * CSS_PX_PER_MM * zoom.value);
const tagH = computed(() => (editLength.value || 20) * CSS_PX_PER_MM * zoom.value);
const previewW = computed(() => (editWidth.value || 40) * CSS_PX_PER_MM * PREVIEW_ZOOM);
const previewH = computed(() => (editLength.value || 20) * CSS_PX_PER_MM * PREVIEW_ZOOM);
const visibleElements = computed(() => elements.value);
const availablePresets = computed(() =>
  ELEMENT_PRESETS.filter((preset) => !elements.value.some((el) => el.name === preset.name)),
);

// Grid is drawn in real mm (1mm cells) inside the same transform:scale
// wrapper as the elements, so it always lines up with them regardless of zoom.
const gridStyle = computed(() => ({
  backgroundImage: [
    "repeating-linear-gradient(0deg, #888 0, #888 0.1mm, transparent 0.1mm, transparent 1mm)",
    "repeating-linear-gradient(90deg, #888 0, #888 0.1mm, transparent 0.1mm, transparent 1mm)",
  ].join(", "),
  backgroundSize: "1mm 1mm",
}));

// ─── Sample content per element ──────────────────────────────────────────────
function sampleText(el: PriceTagElement): string {
  switch (el.name) {
    case "product_name": return sampleProduct.value.name;
    case "price": return `${formatPrice(sampleProduct.value.price)} UZS`;
    case "sku": return `Арт: ${sampleProduct.value.sku}`;
    case "shop_name": return sampleProduct.value.shop;
    case "discount": return "-10%";
    default: return "";
  }
}

function formatPrice(value: number) {
  return Math.round(value).toLocaleString("ru-RU");
}

// ─── Style helpers ────────────────────────────────────────────────────────────
// Plain CSS mm/pt units — identical to components/print/PriceTag.vue's
// elementStyle(). Magnification is handled entirely by the transform:scale()
// wrapper around the canvas/preview, never baked into these numbers, so
// editing here always matches the real print exactly.
function elementTextStyle(el: PriceTagElement): Record<string, string> {
  return {
    display: "block",
    fontSize: `${el.fontSize}pt`,
    fontFamily: el.fontFamily || "Arial, sans-serif",
    fontWeight: el.isBold ? "700" : "400",
    fontStyle: el.isItalic ? "italic" : "normal",
    textDecoration: [el.isUnderlined ? "underline" : "", el.isLineThrough ? "line-through" : ""].filter(Boolean).join(" ") || "none",
    textAlign: el.alignmentType.toLowerCase() as "left" | "center" | "right",
    color: "#111",
    whiteSpace: "nowrap",
    transform: el.rotation ? `rotate(${el.rotation}deg)` : "none",
    transformOrigin: "top left",
  };
}

function elementBarcodeSvg(el: PriceTagElement) {
  return renderBarcodeSvg(sampleProduct.value.barcode || "123456789012", {
    format: editBarcodeType.value as BarcodeFormat,
    height: el.length * CSS_PX_PER_MM,
    displayValue: false,
  });
}

// ─── Drag ─────────────────────────────────────────────────────────────────────
function startDrag(e: MouseEvent, el: PriceTagElement) {
  selectedEl.value = el;
  dragging.value = el;
  dragStartMouseX = e.clientX;
  dragStartMouseY = e.clientY;
  dragStartElX = el.xAxis;
  dragStartElY = el.yAxis;
}

function onCanvasMouseMove(e: MouseEvent) {
  if (!dragging.value || !selectedTemplate.value) return;
  const dx = (e.clientX - dragStartMouseX) / (CSS_PX_PER_MM * zoom.value);
  const dy = (e.clientY - dragStartMouseY) / (CSS_PX_PER_MM * zoom.value);
  const w = editWidth.value || selectedTemplate.value.width;
  const h = editLength.value || selectedTemplate.value.length;
  dragging.value.xAxis = Math.max(0, Math.min(w - 1, +(dragStartElX + dx).toFixed(1)));
  dragging.value.yAxis = Math.max(0, Math.min(h - 1, +(dragStartElY + dy).toFixed(1)));
}

function stopDrag() {
  if (dragging.value) saveTemplate();
  dragging.value = null;
}

function toggleStyle(key: "isBold" | "isItalic" | "isUnderlined" | "isLineThrough") {
  if (!selectedEl.value) return;
  selectedEl.value[key] = !selectedEl.value[key];
  saveTemplate();
}

function setAlignment(a: PriceTagAlignment) {
  if (!selectedEl.value) return;
  selectedEl.value.alignmentType = a;
  saveTemplate();
}

function addElement(preset: PriceTagElement) {
  const el: PriceTagElement = { ...preset, id: `${preset.name}-${Date.now()}` };
  elements.value.push(el);
  selectedEl.value = el;
  showAddMenu.value = false;
  saveTemplate();
}

function removeElement(el: PriceTagElement) {
  elements.value = elements.value.filter((e) => e.id !== el.id);
  if (selectedEl.value?.id === el.id) selectedEl.value = null;
  saveTemplate();
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function loadTemplates() {
  loadingTemplates.value = true;
  try {
    templates.value = await fetchPriceTagTemplateList();
    const requestedId = route.query.templateId ? String(route.query.templateId) : "";
    const initial = (requestedId && templates.value.find((t) => t.id === requestedId)) || templates.value[0];
    if (initial) selectTemplate(initial);
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
  editBarcodeType.value = tpl.barcodeType;
  selectedEl.value = null;
  elements.value = tpl.elements.map((e) => ({ ...e }));
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function currentEditPayload() {
  return {
    name: editName.value,
    width: editWidth.value,
    length: editLength.value,
    barcodeType: editBarcodeType.value,
    elements: elements.value,
  };
}

async function persistTemplate(id: string, payload: ReturnType<typeof currentEditPayload>) {
  saving.value = true;
  try {
    const updated = await updatePriceTagTemplate(id, payload);
    const idx = templates.value.findIndex((t) => t.id === id);
    if (idx !== -1) {
      templates.value[idx] = updated;
      if (selectedTemplate.value?.id === id) selectedTemplate.value = updated;
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
  newName.value = "";
  newWidth.value = 40;
  newLength.value = 20;
  newBarcodeType.value = "CODE128";
  showNewDialog.value = true;
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
    selectTemplate(created);
  } catch (e) {
    console.error("confirmCreate", e);
  } finally {
    showNewDialog.value = false;
  }
}

function deleteTemplate(id: string) {
  deleteTargetId.value = id;
}

async function markAsDefault(tpl: PriceTagTemplate) {
  if (tpl.isDefault) return;
  try {
    const updated = await updatePriceTagTemplate(tpl.id, { isDefault: true });
    templates.value = templates.value.map((t) => ({ ...t, isDefault: t.id === updated.id }));
    if (selectedTemplate.value?.id === updated.id) selectedTemplate.value = updated;
  } catch (e: any) {
    toast.add({ title: "Не удалось назначить шаблон по умолчанию", description: e?.data?.message || e?.message, color: "error" });
  }
}

async function confirmDelete() {
  if (!deleteTargetId.value) return;
  const id = deleteTargetId.value;
  try {
    await deletePriceTagTemplate(id);
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
// Same mm/pt units as elementTextStyle()/elementBarcodeSvg() above — this is
// what makes the printed page match the canvas and preview exactly. (The one
// exception is the barcode's raw pixel height, which jsbarcode requires as a
// number — converted via the same CSS_PX_PER_MM constant used everywhere else.)
function elHtml(el: PriceTagElement): string {
  const rotate = el.rotation ? ` transform:rotate(${el.rotation}deg);transform-origin:top left;` : "";
  const base = `position:absolute;left:${el.xAxis}mm;top:${el.yAxis}mm;width:${el.width}mm;${rotate}`;

  if (el.type === "barcode") {
    const svg = renderBarcodeSvg(sampleProduct.value.barcode || "123456789012", {
      format: editBarcodeType.value as BarcodeFormat,
      height: el.length * CSS_PX_PER_MM,
      displayValue: false,
    });
    const barStyle = `${base}height:${el.length}mm;`;
    const valueStyle = `position:absolute;left:${el.xAxis}mm;top:${el.yAxis + el.length}mm;width:${el.width}mm;font-size:6pt;font-family:Arial, sans-serif;text-align:center;white-space:nowrap;overflow:hidden;color:#111;`;
    return `<div style="${barStyle}">${svg}</div><div style="${valueStyle}">${sampleProduct.value.barcode || "123456789012"}</div>`;
  }

  const text = sampleText(el);
  if (!text) return "";
  const decoration = [el.isUnderlined ? "underline" : "", el.isLineThrough ? "line-through" : ""].filter(Boolean).join(" ") || "none";
  const style = `${base}font-family:${el.fontFamily || "Arial, sans-serif"};font-size:${el.fontSize}pt;font-weight:${el.isBold ? 700 : 400};font-style:${el.isItalic ? "italic" : "normal"};text-decoration:${decoration};text-align:${el.alignmentType.toLowerCase()};color:#111;white-space:nowrap;`;
  return `<span style="${style}">${text}</span>`;
}

function buildPrintHtml(count: number): string {
  if (!selectedTemplate.value) return "";
  const tpl = selectedTemplate.value;
  const w = editWidth.value || tpl.width;
  const h = editLength.value || tpl.length;

  // One tag per physical page, sized exactly to the template — matches a
  // label printer/roll where the page IS the label, not a sheet you'd
  // margin/center content on.
  const tagStyle = `position:relative;width:${w}mm;height:${h}mm;overflow:hidden;background:white;page-break-after:always;break-after:page;`;
  const singleTag = `<div style="${tagStyle}">${elements.value.map(elHtml).join("")}</div>`;
  const body = Array(count).fill(singleTag).join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Ценники — ${tpl.name}</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;}@page{size:${w}mm ${h}mm;margin:0}</style>
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
  setTimeout(() => win.print(), 300);
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

.price-tag-barcode :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
.price-tag-barcode-value {
  font-size: 6pt;
  font-family: Arial, sans-serif;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  color: #111;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.dialog-enter-active, .dialog-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; transform: scale(0.96); }
</style>
