<template>
  <section class="fixed inset-0 flex flex-col bg-[#141414] text-white overflow-hidden" style="z-index:10;">

    <!-- Top bar -->
    <div class="flex-none border-b border-white/8 bg-[#1a1a1a]">
      <div class="flex items-center justify-between gap-4 px-6 py-3.5">
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-[#2a2a2a] hover:bg-[#333] transition-colors text-sm font-medium"
            @click="router.push('/settings/cheque')"
          >
            <Icon name="heroicons:chevron-left" class="w-4 h-4" />
            Назад
          </button>
          <div>
            <h1 class="text-[17px] font-bold leading-tight">{{ form?.name || 'Чек' }}</h1>
            <p class="text-[11px] text-[#555] mt-0.5">Шаблон чека</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Transition name="fade">
            <span v-if="saving" class="text-[11px] text-[#555]">Сохранение...</span>
          </Transition>
          <button class="px-4 py-2 rounded-[14px] bg-[#2a2a2a] hover:bg-[#333] text-sm font-medium transition-colors" @click="printTestCheque">
            <Icon name="heroicons:printer" class="w-4 h-4 inline mr-1.5" />Печать
          </button>
          <button
            class="px-5 py-2 rounded-[14px] bg-[#1f78ff] hover:bg-[#3d8bff] text-sm font-semibold transition-colors disabled:opacity-40"
            :disabled="saving || !form"
            @click="save"
          >Сохранить</button>
        </div>
      </div>
    </div>

    <!-- Loading / error -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-[#444]" />
    </div>
    <div v-else-if="errorMessage" class="flex-1 flex items-center justify-center text-red-400 text-sm px-6">
      {{ errorMessage }}
    </div>

    <!-- Editor -->
    <div v-else-if="form" class="flex-1 flex overflow-hidden">

      <!-- ── Left sidebar ── -->
      <div class="w-72 flex-none border-r border-white/8 bg-[#191919] overflow-y-auto">
        <div class="p-4 space-y-1.5">

          <!-- Основное -->
          <div class="accordion">
            <button class="acc-head" @click="toggleSection('basic')">
              <Icon name="heroicons:document-text" class="w-3.5 h-3.5 text-[#555]" />
              <span class="flex-1">Основное</span>
              <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5 text-[#555] transition-transform" :class="{ 'rotate-180': openSections.basic }" />
            </button>
            <div v-show="openSections.basic" class="acc-body space-y-3">
              <div class="field"><span class="label">Название</span>
                <input v-model="form.name" class="inp" />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="field"><span class="label">Ширина мм</span>
                  <input v-model.number="form.width" type="number" min="40" class="inp" />
                </div>
                <div class="field"><span class="label">Длина</span>
                  <input v-model.number="form.length" type="number" min="0" class="inp" />
                </div>
              </div>
              <label class="toggle-row"><input type="checkbox" v-model="form.compact" class="cb" @change="onCompactChange" /><span class="text-[12px] text-[#ccc]">Компактный (58 мм)</span></label>
              <label class="toggle-row"><input type="checkbox" v-model="form.is_default" class="cb" /><span class="text-[12px] text-[#ccc]">По умолчанию</span></label>
            </div>
          </div>

          <!-- Контакты -->
          <div class="accordion">
            <button class="acc-head" @click="toggleSection('contacts')">
              <Icon name="heroicons:phone" class="w-3.5 h-3.5 text-[#555]" />
              <span class="flex-1">Контакты и информация</span>
              <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5 text-[#555] transition-transform" :class="{ 'rotate-180': openSections.contacts }" />
            </button>
            <div v-show="openSections.contacts" class="acc-body space-y-2">
              <div class="toggle-field">
                <label class="toggle-row"><input type="checkbox" v-model="extra.hasPhone" class="cb" /><span class="text-[12px] text-[#ccc]">Телефон</span></label>
                <input v-if="extra.hasPhone" v-model="extra.phone" class="inp mt-1" placeholder="+998 90 123 4567" />
              </div>
              <div class="toggle-field">
                <label class="toggle-row"><input type="checkbox" v-model="extra.hasAddress" class="cb" /><span class="text-[12px] text-[#ccc]">Адрес</span></label>
                <input v-if="extra.hasAddress" v-model="extra.address" class="inp mt-1" placeholder="г. Ташкент, ул. Навои 1" />
              </div>
              <div class="toggle-field">
                <label class="toggle-row"><input type="checkbox" v-model="extra.hasWorkingHours" class="cb" /><span class="text-[12px] text-[#ccc]">Часы работы</span></label>
                <input v-if="extra.hasWorkingHours" v-model="extra.workingHours" class="inp mt-1" placeholder="09:00 – 22:00" />
              </div>
              <div class="toggle-field">
                <label class="toggle-row"><input type="checkbox" v-model="extra.hasBranchName" class="cb" /><span class="text-[12px] text-[#ccc]">Название филиала</span></label>
                <input v-if="extra.hasBranchName" v-model="extra.branchName" class="inp mt-1" placeholder="Samarqand Darvoza" />
              </div>
              <div class="toggle-field">
                <label class="toggle-row"><input type="checkbox" v-model="extra.hasWebsite" class="cb" /><span class="text-[12px] text-[#ccc]">Сайт</span></label>
                <input v-if="extra.hasWebsite" v-model="extra.website" class="inp mt-1" placeholder="https://shop.uz" />
              </div>
              <div class="toggle-field">
                <label class="toggle-row"><input type="checkbox" v-model="extra.hasTaxId" class="cb" /><span class="text-[12px] text-[#ccc]">ИНН / СТИР</span></label>
                <input v-if="extra.hasTaxId" v-model="extra.taxId" class="inp mt-1" placeholder="123456789" />
              </div>
            </div>
          </div>

          <!-- Блоки -->
          <div class="accordion">
            <button class="acc-head" @click="toggleSection('blocks')">
              <Icon name="heroicons:squares-2x2" class="w-3.5 h-3.5 text-[#555]" />
              <span class="flex-1">Блоки чека</span>
              <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5 text-[#555] transition-transform" :class="{ 'rotate-180': openSections.blocks }" />
            </button>
            <div v-show="openSections.blocks" class="acc-body space-y-0.5">
              <label class="toggle-row"><input type="checkbox" v-model="form.has_logo" class="cb" /><span class="text-[12px] text-[#ccc]">Логотип</span></label>
              <label class="toggle-row"><input type="checkbox" v-model="form.has_information_block" class="cb" /><span class="text-[12px] text-[#ccc]">Информационный блок</span></label>
              <label class="toggle-row"><input type="checkbox" v-model="form.has_additional_info" class="cb" /><span class="text-[12px] text-[#ccc]">Доп. информация</span></label>
              <label class="toggle-row"><input type="checkbox" v-model="form.has_lower_block" class="cb" /><span class="text-[12px] text-[#ccc]">Нижний блок</span></label>
              <label class="toggle-row"><input type="checkbox" v-model="form.has_bar_code" class="cb" /><span class="text-[12px] text-[#ccc]">Штрих-код</span></label>
              <label class="toggle-row"><input type="checkbox" v-model="form.has_customer_debt" class="cb" /><span class="text-[12px] text-[#ccc]">Долг клиента</span></label>
              <label class="toggle-row"><input type="checkbox" v-model="form.has_customer_balance" class="cb" /><span class="text-[12px] text-[#ccc]">Баланс клиента</span></label>
            </div>
          </div>

          <!-- QR-код -->
          <div class="accordion">
            <button class="acc-head" @click="toggleSection('qr')">
              <Icon name="heroicons:qr-code" class="w-3.5 h-3.5 text-[#555]" />
              <span class="flex-1">QR-код</span>
              <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5 text-[#555] transition-transform" :class="{ 'rotate-180': openSections.qr }" />
            </button>
            <div v-show="openSections.qr" class="acc-body space-y-2">
              <label class="toggle-row"><input type="checkbox" v-model="extra.hasQrCode" class="cb" /><span class="text-[12px] text-[#ccc]">Показывать QR-код</span></label>
              <div v-if="extra.hasQrCode" class="field">
                <span class="label">Ссылка для QR</span>
                <input v-model="extra.qrCodeUrl" class="inp" placeholder="https://..." />
              </div>
            </div>
          </div>

          <!-- Нижний текст -->
          <div class="accordion">
            <button class="acc-head" @click="toggleSection('footer')">
              <Icon name="heroicons:chat-bubble-bottom-center-text" class="w-3.5 h-3.5 text-[#555]" />
              <span class="flex-1">Нижний текст</span>
              <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5 text-[#555] transition-transform" :class="{ 'rotate-180': openSections.footer }" />
            </button>
            <div v-show="openSections.footer" class="acc-body">
              <textarea v-model="form.display_text" class="inp-area" rows="3" placeholder="Спасибо за покупку!" />
            </div>
          </div>

          <!-- Порядок элементов -->
          <div class="accordion">
            <button class="acc-head" @click="toggleSection('items')">
              <Icon name="heroicons:bars-3" class="w-3.5 h-3.5 text-[#555]" />
              <span class="flex-1">Порядок элементов</span>
              <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5 text-[#555] transition-transform" :class="{ 'rotate-180': openSections.items }" />
            </button>
            <div v-show="openSections.items" class="acc-body space-y-0.5">
              <div
                v-for="el in sortedAllElements"
                :key="el.id"
                draggable="true"
                class="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] bg-[#222] element-row"
                :class="{
                  'element-row-dragging': sidebarDragItem?.id === el.id,
                  'element-row-dragover': sidebarDragOverItem?.id === el.id,
                  'bg-white/8': selectedElement?.id === el.id,
                }"
                @click="selectedElement = el"
                @dragstart="onSidebarDragStart($event, el)"
                @dragover.prevent="onSidebarDragOver($event, el)"
                @drop.prevent="onSidebarDrop(el)"
                @dragend="sidebarDragItem = null"
              >
                <input
                  type="checkbox"
                  v-model="el.visible"
                  class="cb flex-none"
                  @click.stop
                />
                <span class="flex-1 text-[12px] truncate" :class="el.visible ? 'text-[#ccc]' : 'text-[#555]'">{{ el.label }}</span>
                <div class="flex gap-0.5">
                  <button @click.stop="moveElementOrder(el, -1)" class="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[#555]">
                    <Icon name="heroicons:chevron-up" class="w-3 h-3" />
                  </button>
                  <button @click.stop="moveElementOrder(el, 1)" class="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[#555]">
                    <Icon name="heroicons:chevron-down" class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ── Center: receipt preview ── -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#111]">

        <!-- Toolbar -->
        <div class="flex items-center gap-3 px-5 py-3 border-b border-white/8 flex-none bg-[#191919]">
          <template v-if="selectedElement">
            <span class="text-[12px] text-[#888] font-medium">{{ selectedElement.label }}</span>
            <div class="h-4 w-px bg-white/10" />
            <template v-if="!selectedElement.id.startsWith('hr')">
              <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
                Размер
                <input type="number" min="8" max="24" v-model.number="selectedElement.fontSize" class="input-sm w-12" />
                pt
              </label>
              <label class="flex items-center gap-1.5 text-[11px] text-[#777] cursor-pointer">
                <input type="checkbox" :checked="selectedElement.fontWeight === 'bold'" @change="toggleElementBold" class="w-3 h-3 accent-[#1f78ff]" />
                Жирный
              </label>
              <div class="h-4 w-px bg-white/10" />
            </template>
            <label class="flex items-center gap-1.5 text-[11px] text-[#777]">
              Отступ
              <input type="number" min="0" max="40" v-model.number="selectedElement.marginBottom" class="input-sm w-12" />
              px
            </label>
          </template>
          <span v-else class="text-[11px] text-[#444]">Кликните на элемент в чеке для настройки</span>
        </div>

        <!-- Preview area -->
        <div class="flex-1 overflow-auto flex items-start justify-center py-12">
          <div
            class="rc-preview"
            :style="{ width: receiptWidthPx + 'px' }"
          >
            <!-- Logo -->
            <div v-if="form.has_logo" class="rc-logo">
              ЛОГОТИП
            </div>

            <!-- Interactive receipt elements -->
            <div
              v-for="el in sortedVisibleElements"
              :key="el.id"
              class="cursor-pointer transition-all"
              :style="{
                fontSize: el.fontSize ? el.fontSize + 'px' : '12px',
                fontWeight: el.fontWeight === 'bold' ? '900' : 'normal',
                outline: selectedElement?.id === el.id ? '2px solid #1f78ff' : 'none',
                outlineOffset: '2px',
                paddingTop: '2px',
                marginBottom: (el.marginBottom ?? 4) + 'px',
              }"
              draggable="true"
              @click="selectedElement = el"
              @dragstart="onPreviewDragStart($event, el)"
              @dragover.prevent="onPreviewDragOver($event, el)"
              @drop.prevent="onPreviewDrop(el)"
              @dragend="previewDragItem = null"
            >
              <!-- shopName -->
              <div v-if="el.id === 'shopName'" class="text-center font-bold">{{ form.name || 'Название магазина' }}</div>
              <!-- branch -->
              <div v-else-if="el.id === 'branch'" class="text-center rc-muted">{{ extra.branchName || 'Филиал' }}</div>
              <!-- address -->
              <div v-else-if="el.id === 'address'" class="text-center rc-muted">{{ extra.address || 'Адрес' }}</div>
              <!-- phone -->
              <div v-else-if="el.id === 'phone'" class="text-center rc-muted">{{ extra.phone || 'Телефон' }}</div>
              <!-- workingHours -->
              <div v-else-if="el.id === 'workingHours'" class="text-center rc-muted">{{ extra.workingHours || 'Часы работы' }}</div>
              <!-- website -->
              <div v-else-if="el.id === 'website'" class="text-center rc-muted">{{ extra.website || 'Сайт' }}</div>
              <!-- separators -->
              <div v-else-if="el.id.startsWith('hr')" class="rec-hr" />
              <!-- chequeNumber -->
              <div v-else-if="el.id === 'chequeNumber'" class="flex justify-between">
                <span class="rc-muted">Sotuv:</span><span class="font-bold">№TEST-001</span>
              </div>
              <!-- date -->
              <div v-else-if="el.id === 'date'" class="flex justify-between">
                <span class="rc-muted">Sana:</span><span class="font-bold">{{ nowStr }}</span>
              </div>
              <!-- taxId -->
              <div v-else-if="el.id === 'taxId'" class="flex justify-between rc-muted">
                <span>ИНН:</span><span>{{ extra.taxId || '123456789' }}</span>
              </div>
              <!-- seller -->
              <div v-else-if="el.id === 'seller'" class="flex justify-between">
                <span class="rc-muted">Menejer:</span><span class="font-bold">Иванов И.</span>
              </div>
              <!-- cashier -->
              <div v-else-if="el.id === 'cashier'" class="flex justify-between">
                <span class="rc-muted">Кассир:</span><span class="font-bold">—</span>
              </div>
              <!-- client -->
              <div v-else-if="el.id === 'client'" class="font-bold">Klient: —</div>
              <!-- items -->
              <div v-else-if="el.id === 'items'">
                <div class="rc-items-header">
                  <span class="rc-idx">№</span><span>Nomi</span><span class="rc-center-col">Son</span><span class="rc-right-col">Narxi</span>
                </div>
                <div v-for="(line, idx) in previewLines" :key="line.name" class="rc-item-row">
                  <span class="rc-idx">{{ idx + 1 }}</span>
                  <span>{{ line.name }}</span>
                  <span class="rc-center-col rc-muted">{{ line.quantity }}</span>
                  <span class="rc-right-col font-bold">{{ fmtMoney(line.total) }}</span>
                </div>
              </div>
              <!-- total -->
              <div v-else-if="el.id === 'total'" class="flex justify-between" style="font-size:18px;font-weight:800;">
                <span>К оплате:</span><span>{{ fmtMoney(previewTotal) }}</span>
              </div>
              <!-- payment -->
              <div v-else-if="el.id === 'payment'" class="flex justify-between">
                <span class="rc-muted">Оплачено (карта):</span><span class="font-bold">{{ fmtMoney(previewTotal) }}</span>
              </div>
              <!-- debt -->
              <div v-else-if="el.id === 'debt'" class="flex justify-between">
                <span class="rc-muted">В долг:</span><span class="font-bold">0</span>
              </div>
              <!-- balance -->
              <div v-else-if="el.id === 'balance'" class="flex justify-between">
                <span class="rc-muted">Баланс:</span><span class="font-bold">0</span>
              </div>
              <!-- barcode -->
              <div v-else-if="el.id === 'barcode'" class="text-center">
                <div class="tracking-widest font-black text-[18px] leading-none">||| ||| |||| |||||</div>
                <div class="text-[10px] rc-muted mt-0.5">1234567890123</div>
              </div>
              <!-- footer -->
              <div v-else-if="el.id === 'footer'" class="text-center font-bold whitespace-pre-wrap">{{ form.display_text || 'Спасибо за покупку!' }}</div>
              <!-- qrCode -->
              <div v-else-if="el.id === 'qrCode'" class="flex flex-col items-center gap-1">
                <div v-if="extra.qrCodeUrl" class="rc-qr" v-html="renderQrSvg(extra.qrCodeUrl, { pixelSize: 4, blackColor: '#f5f5f5' })" />
                <div v-else class="w-16 h-16 border border-dashed border-white/20 flex items-center justify-center rc-muted text-[10px] rounded">QR</div>
                <div class="text-[10px] rc-muted text-center">QR для фискального контроля</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { renderQrSvg } from "@/utils/qrcode";
import { useHead, useRoute, useRouter } from "#imports";
import { useCheques, type Cheque, type ChequeItem, type ChequeExtraSettings } from "@/composables/useCheques";

useHead({ title: "Редактирование чека | Konkurent" });
definePageMeta({ layout: "empty" });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { getChequeById, updateCheque } = useCheques();

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const form = ref<Cheque | null>(null);

const extra = reactive<Required<ChequeExtraSettings>>({
  phone: "", address: "", workingHours: "", website: "",
  qrCodeUrl: "", branchName: "", taxId: "",
  hasPhone: false, hasAddress: false, hasWorkingHours: false,
  hasQrCode: false, hasTaxId: false, hasBranchName: false, hasWebsite: false,
  elementStyles: undefined as any,
});

const openSections = reactive({
  basic: true, contacts: false, blocks: true,
  qr: false, footer: false, items: true,
});

function toggleSection(key: keyof typeof openSections) {
  openSections[key] = !openSections[key];
}

const chequeId = computed(() => String(route.params.id || ""));

// ─── Receipt element system ──────────────────────────────────────────────────
interface ReceiptElementStyle {
  id: string;
  label: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  visible: boolean;
  order: number;
  marginBottom?: number;
}

const DEFAULT_RECEIPT_ELEMENTS: ReceiptElementStyle[] = [
  { id: "shopName", label: "Название магазина", fontSize: 14, fontWeight: "bold", visible: true, order: 0, marginBottom: 3 },
  { id: "branch", label: "Филиал", fontSize: 11, fontWeight: "normal", visible: true, order: 1, marginBottom: 2 },
  { id: "address", label: "Адрес", fontSize: 11, fontWeight: "normal", visible: true, order: 2, marginBottom: 2 },
  { id: "phone", label: "Телефон", fontSize: 11, fontWeight: "normal", visible: true, order: 3, marginBottom: 2 },
  { id: "workingHours", label: "Часы работы", fontSize: 11, fontWeight: "normal", visible: false, order: 4, marginBottom: 2 },
  { id: "website", label: "Сайт", fontSize: 11, fontWeight: "normal", visible: false, order: 5, marginBottom: 2 },
  { id: "hr1", label: "─ Разделитель ─", fontSize: 0, fontWeight: "normal", visible: true, order: 6, marginBottom: 4 },
  { id: "chequeNumber", label: "Номер чека", fontSize: 12, fontWeight: "bold", visible: true, order: 7, marginBottom: 3 },
  { id: "date", label: "Дата", fontSize: 11, fontWeight: "normal", visible: true, order: 8, marginBottom: 3 },
  { id: "taxId", label: "ИНН", fontSize: 11, fontWeight: "normal", visible: false, order: 9, marginBottom: 3 },
  { id: "seller", label: "Продавец", fontSize: 11, fontWeight: "normal", visible: true, order: 10, marginBottom: 3 },
  { id: "cashier", label: "Кассир", fontSize: 11, fontWeight: "normal", visible: true, order: 11, marginBottom: 3 },
  { id: "client", label: "Клиент", fontSize: 11, fontWeight: "normal", visible: true, order: 12, marginBottom: 3 },
  { id: "hr2", label: "─ Разделитель ─", fontSize: 0, fontWeight: "normal", visible: true, order: 13, marginBottom: 4 },
  { id: "items", label: "Товары", fontSize: 12, fontWeight: "bold", visible: true, order: 14, marginBottom: 6 },
  { id: "hr3", label: "─ Разделитель ─", fontSize: 0, fontWeight: "normal", visible: true, order: 15, marginBottom: 4 },
  { id: "total", label: "ИТОГО", fontSize: 14, fontWeight: "bold", visible: true, order: 16, marginBottom: 3 },
  { id: "payment", label: "Оплата", fontSize: 11, fontWeight: "normal", visible: true, order: 17, marginBottom: 3 },
  { id: "debt", label: "Долг клиента", fontSize: 11, fontWeight: "normal", visible: false, order: 18, marginBottom: 3 },
  { id: "balance", label: "Баланс клиента", fontSize: 11, fontWeight: "normal", visible: false, order: 19, marginBottom: 3 },
  { id: "hr4", label: "─ Разделитель ─", fontSize: 0, fontWeight: "normal", visible: true, order: 20, marginBottom: 4 },
  { id: "barcode", label: "Штрих-код", fontSize: 14, fontWeight: "bold", visible: true, order: 21, marginBottom: 6 },
  { id: "footer", label: "Нижний текст", fontSize: 11, fontWeight: "normal", visible: true, order: 22, marginBottom: 4 },
  { id: "qrCode", label: "QR-код", fontSize: 0, fontWeight: "normal", visible: false, order: 23, marginBottom: 6 },
];

const receiptElements = ref<ReceiptElementStyle[]>(DEFAULT_RECEIPT_ELEMENTS.map(el => ({ ...el })));
const selectedElement = ref<ReceiptElementStyle | null>(null);

const sortedVisibleElements = computed(() =>
  [...receiptElements.value].filter(el => el.visible).sort((a, b) => a.order - b.order)
);

const sortedAllElements = computed(() =>
  [...receiptElements.value].sort((a, b) => a.order - b.order)
);

function mergeElementStyles(saved: ReceiptElementStyle[]): ReceiptElementStyle[] {
  const map = new Map(saved.map(el => [el.id, el]));
  const merged: ReceiptElementStyle[] = [];
  const usedIds = new Set<string>();

  // First, include all saved elements in their saved order
  for (const s of saved) {
    const def = DEFAULT_RECEIPT_ELEMENTS.find(d => d.id === s.id);
    merged.push({
      id: s.id,
      label: def?.label ?? s.label,
      fontSize: s.fontSize ?? def?.fontSize ?? 12,
      fontWeight: s.fontWeight ?? def?.fontWeight ?? "normal",
      visible: s.visible ?? true,
      order: s.order ?? merged.length,
      marginBottom: s.marginBottom ?? def?.marginBottom ?? 4,
    });
    usedIds.add(s.id);
  }

  // Then add any new defaults that weren't in saved
  for (const d of DEFAULT_RECEIPT_ELEMENTS) {
    if (!usedIds.has(d.id)) {
      merged.push({ ...d, order: merged.length });
    }
  }

  // Re-normalize order
  merged.sort((a, b) => a.order - b.order);
  merged.forEach((el, i) => { el.order = i; });

  return merged;
}

// ─── Preview drag-and-drop ───────────────────────────────────────────────────
const previewDragItem = ref<ReceiptElementStyle | null>(null);

function onPreviewDragStart(e: DragEvent, el: ReceiptElementStyle) {
  previewDragItem.value = el;
  selectedElement.value = el;
}

function onPreviewDragOver(e: DragEvent, el: ReceiptElementStyle) {
  e.preventDefault();
}

function onPreviewDrop(targetEl: ReceiptElementStyle) {
  if (!previewDragItem.value || previewDragItem.value.id === targetEl.id) return;
  const sorted = [...receiptElements.value].sort((a, b) => a.order - b.order);
  const fromIdx = sorted.findIndex(e => e.id === previewDragItem.value!.id);
  const toIdx = sorted.findIndex(e => e.id === targetEl.id);
  if (fromIdx < 0 || toIdx < 0) return;
  const [moved] = sorted.splice(fromIdx, 1);
  if (!moved) return;
  sorted.splice(toIdx, 0, moved);
  sorted.forEach((el, i) => { el.order = i; });
  previewDragItem.value = null;
}

// ─── Sidebar drag-and-drop ───────────────────────────────────────────────────
const sidebarDragItem = ref<ReceiptElementStyle | null>(null);
const sidebarDragOverItem = ref<ReceiptElementStyle | null>(null);

function onSidebarDragStart(e: DragEvent, el: ReceiptElementStyle) {
  sidebarDragItem.value = el;
  selectedElement.value = el;
}

function onSidebarDragOver(e: DragEvent, el: ReceiptElementStyle) {
  e.preventDefault();
  sidebarDragOverItem.value = el;
}

function onSidebarDrop(targetEl: ReceiptElementStyle) {
  if (!sidebarDragItem.value || sidebarDragItem.value.id === targetEl.id) {
    sidebarDragItem.value = null;
    sidebarDragOverItem.value = null;
    return;
  }
  const sorted = [...receiptElements.value].sort((a, b) => a.order - b.order);
  const fromIdx = sorted.findIndex(e => e.id === sidebarDragItem.value!.id);
  const toIdx = sorted.findIndex(e => e.id === targetEl.id);
  if (fromIdx < 0 || toIdx < 0) return;
  const [moved] = sorted.splice(fromIdx, 1);
  if (!moved) return;
  sorted.splice(toIdx, 0, moved);
  sorted.forEach((el, i) => { el.order = i; });
  sidebarDragItem.value = null;
  sidebarDragOverItem.value = null;
}

function moveElementOrder(el: ReceiptElementStyle, dir: -1 | 1) {
  const sorted = [...receiptElements.value].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex(e => e.id === el.id);
  const targetIdx = idx + dir;
  if (idx < 0 || targetIdx < 0 || targetIdx >= sorted.length) return;
  const tmp = sorted[idx]!.order;
  sorted[idx]!.order = sorted[targetIdx]!.order;
  sorted[targetIdx]!.order = tmp;
}

function toggleElementBold(e: Event) {
  if (!selectedElement.value) return;
  selectedElement.value.fontWeight = (e.target as HTMLInputElement).checked ? "bold" : "normal";
}

// ─── Preview data ────────────────────────────────────────────────────────────
const previewLines = [
  { name: "Силиконовый Iphone Чехол", quantity: 1, price: 65000, total: 65000 },
  { name: "Стекло Samsung S22", quantity: 2, price: 37500, total: 75000 },
];
const previewTotal = previewLines.reduce((s, l) => s + l.total, 0);
const nowStr = new Date().toLocaleString("ru-RU", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

const receiptWidthPx = computed(() => {
  if (!form.value) return 302;
  return form.value.compact || (form.value.width ?? 80) <= 58 ? 220 : 302;
});

const groupedItems = computed(() => {
  const groups = new Map<string, ChequeItem[]>();
  for (const item of form.value?.cheque_items ?? []) {
    const key = item.cheque_option?.block_type || "other";
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([blockType, items]) => ({
    blockType,
    title: blockTitleMap[blockType] ?? blockType ?? "Другие",
    items: [...items].sort((a, b) => Number(a.sequence_number ?? 0) - Number(b.sequence_number ?? 0)),
  }));
});

const blockTitleMap: Record<string, string> = {
  information_block: "Информационный блок",
  lower_block: "Нижний блок",
  customer_balance: "Баланс клиента",
  customer_debt: "Долг клиента",
};

function itemName(item: ChequeItem) {
  return item.cheque_option?.name || item.cheque_option_id || "Блок";
}

function fmtMoney(v: number) {
  return Math.round(v).toLocaleString("ru-RU") + " UZS";
}

function onCompactChange(e: Event) {
  if (form.value) form.value.width = (e.target as HTMLInputElement).checked ? 58 : 80;
}

function buildPayload() {
  const f = form.value!;
  return {
    name: f.name || "",
    has_logo: Boolean(f.has_logo),
    has_information_block: Boolean(f.has_information_block),
    has_additional_info: Boolean(f.has_additional_info),
    has_lower_block: Boolean(f.has_lower_block),
    display_text: f.display_text || "",
    has_bar_code: Boolean(f.has_bar_code),
    is_default: Boolean(f.is_default),
    has_customer_debt: Boolean(f.has_customer_debt),
    has_customer_balance: Boolean(f.has_customer_balance),
    printed_with_billz: Boolean(f.printed_with_billz),
    width: Number(f.width) || 80,
    length: Number(f.length) || 0,
    compact: Boolean(f.compact),
    extra_settings: {
      ...extra,
      elementStyles: receiptElements.value.map(el => ({ ...el })),
    },
    cheque_items: (f.cheque_items ?? [])
      .filter((i) => i.cheque_option_id || i.cheque_option?.id)
      .map((i, idx) => ({
        id: i.id,
        cheque_option_id: String(i.cheque_option_id || i.cheque_option?.id || ""),
        product_characteristic_id: i.product_characteristic_id || "",
        attribute_id: i.attribute_id || "",
        is_active: i.is_active !== false,
        sequence_number: Number(i.sequence_number ?? idx + 1),
      })),
  };
}

async function save() {
  if (!form.value || saving.value) return;
  saving.value = true;
  try {
    const updated = await updateCheque(chequeId.value, buildPayload());
    if (updated) form.value = updated;
    toast.add({ title: "Сохранено", color: "success" });
  } catch (e: any) {
    toast.add({ title: "Ошибка сохранения", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    saving.value = false;
  }
}

function escHtml(v: unknown) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function printTestCheque() {
  if (!import.meta.client || !form.value) return;
  const wMm = (form.value.compact || (form.value.width ?? 80) <= 58) ? "58mm" : "80mm";
  const lengthMm = Number(form.value.length) || 0;
  const hMm = lengthMm > 0 ? `${lengthMm}mm` : "auto";
  const font = "font-family:Arial,Helvetica,sans-serif";
  const rows = previewLines.map((l) =>
    `<tr><td style="${font};padding:2px 0;vertical-align:top"><span style="${font};font-weight:900">${escHtml(l.name)}</span><br/><span style="${font};color:#666;font-size:11px">${l.quantity} × ${fmtMoney(l.price)}</span></td><td style="${font};text-align:right;white-space:nowrap;padding:2px 0;vertical-align:top">${fmtMoney(l.total)}</td></tr>`
  ).join("");
  const contacts = [
    extra.hasBranchName && extra.branchName,
    extra.hasAddress && extra.address,
    extra.hasPhone && extra.phone,
    extra.hasWorkingHours && extra.workingHours,
    extra.hasWebsite && extra.website,
  ].filter(Boolean).map((t) => `<div style="${font};color:#666;font-size:11px">${escHtml(t)}</div>`).join("");

  const hrStyle = "border:none;border-top:1px dashed #999;margin:8px 0";

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Чек</title>
<style>*{box-sizing:border-box;margin:0;padding:0}@page{margin:0;size:${wMm} ${hMm}}</style></head><body style="margin:0;background:white;color:#111;${font};font-size:12px"><div style="width:${wMm};padding:14px">
${form.value.has_logo ? `<div style="${font};text-align:center;border:1px dashed #ccc;padding:8px;color:#bbb;margin-bottom:8px">LOGO</div>` : ""}
<div style="${font};text-align:center;font-weight:900">${escHtml(form.value.name)}</div>
${contacts ? `<div style="text-align:center">${contacts}</div>` : ""}
<hr style="${hrStyle}"/>
<div style="${font}">Чек #TEST-001 &nbsp;&nbsp; ${escHtml(nowStr)}</div>
${extra.hasTaxId && extra.taxId ? `<div style="${font};color:#666;font-size:11px">ИНН: ${escHtml(extra.taxId)}</div>` : ""}
<hr style="${hrStyle}"/>
<table style="width:100%;border-collapse:collapse;${font}">${rows}</table>
<hr style="${hrStyle}"/>
<div style="${font};display:flex;justify-content:space-between"><span style="font-weight:900">ИТОГО</span><span style="font-weight:900">${fmtMoney(previewTotal)}</span></div>
<div style="${font};display:flex;justify-content:space-between;color:#666;font-size:11px"><span>Наличные</span><span>${fmtMoney(previewTotal)}</span></div>
${form.value.has_customer_debt ? `<div style="${font};display:flex;justify-content:space-between;color:#666;font-size:11px"><span>Долг</span><span>0 UZS</span></div>` : ""}
${form.value.has_lower_block && form.value.display_text ? `<hr style="${hrStyle}"/><div style="${font};text-align:center;color:#666;font-size:11px">${escHtml(form.value.display_text)}</div>` : ""}
${form.value.has_bar_code ? `<hr style="${hrStyle}"/><div style="${font};text-align:center;letter-spacing:4px;font-size:18px;font-weight:900">||| |||| |||||</div><div style="${font};text-align:center;color:#666;font-size:11px">1234567890123</div>` : ""}
${extra.hasQrCode ? `<hr style="${hrStyle}"/><div style="text-align:center"><div style="${font};width:60px;height:60px;border:1px dashed #ccc;display:inline-flex;align-items:center;justify-content:center;color:#ccc;font-size:10px">QR</div>${extra.qrCodeUrl ? `<div style="${font};color:#666;font-size:11px">${escHtml(extra.qrCodeUrl)}</div>` : ""}</div>` : ""}
</div><script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

async function fetchData() {
  if (!chequeId.value) return;
  loading.value = true;
  errorMessage.value = "";
  try {
    const chequeResp = await getChequeById(chequeId.value);
    form.value = chequeResp;
    const es = chequeResp?.extra_settings ?? {};
    Object.assign(extra, {
      phone: es.phone ?? "",
      address: es.address ?? "",
      workingHours: es.workingHours ?? "",
      website: es.website ?? "",
      qrCodeUrl: es.qrCodeUrl ?? "",
      branchName: es.branchName ?? "",
      taxId: es.taxId ?? "",
      hasPhone: es.hasPhone ?? false,
      hasAddress: es.hasAddress ?? false,
      hasWorkingHours: es.hasWorkingHours ?? false,
      hasQrCode: es.hasQrCode ?? false,
      hasTaxId: es.hasTaxId ?? false,
      hasBranchName: es.hasBranchName ?? false,
      hasWebsite: es.hasWebsite ?? false,
    });
    // Restore element styles from extra_settings
    if (es.elementStyles) {
      receiptElements.value = mergeElementStyles(es.elementStyles);
    }
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || "Ошибка загрузки";
  } finally {
    loading.value = false;
  }
}

fetchData();
</script>

<style scoped>
.accordion {
  border-radius: 14px;
  overflow: hidden;
  background: #1f1f1f;
  border: 1px solid rgba(255,255,255,0.05);
}
.acc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #aaa;
  transition: background 0.1s;
}
.acc-head:hover { background: rgba(255,255,255,0.03); }
.acc-body { padding: 0 14px 14px; }
.inp {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: #2a2a2a;
  color: #fff;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}
.inp:focus { border-color: #1f78ff; }
.inp-area {
  display: block;
  width: 100%;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: #2a2a2a;
  color: #fff;
  font-size: 12px;
  outline: none;
  resize: vertical;
}
.inp-area:focus { border-color: #1f78ff; }
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
.field { display: grid; gap: 5px; }
.label { font-size: 11px; font-weight: 500; color: #555; }
.toggle-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; }
.toggle-field { }
.cb { width: 14px; height: 14px; accent-color: #1f78ff; flex-shrink: 0; cursor: pointer; }
.rec-hr { border-top: 1px dashed rgba(255,255,255,0.18); margin: 8px 0; }

.rc-preview {
  background: #1a1a1a;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  font-family: "Courier New", ui-monospace, monospace;
  line-height: 1.5;
  padding: 24px 20px;
}
.rc-logo {
  text-align: center;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  color: #666;
  font-size: 11px;
}
.rc-muted { color: #8a8a8a; }
.rc-items-header {
  display: grid;
  grid-template-columns: 18px 1fr 32px 74px;
  column-gap: 8px;
  color: #8a8a8a;
  font-size: 11px;
  padding-bottom: 6px;
}
.rc-item-row {
  display: grid;
  grid-template-columns: 18px 1fr 32px 74px;
  column-gap: 8px;
  align-items: start;
  padding: 6px 0;
}
.rc-idx { color: #666; font-size: 11px; }
.rc-center-col { text-align: center; }
.rc-right-col { text-align: right; }
.rc-qr :deep(svg) { width: 90px; height: 90px; }
.element-row { cursor: grab; transition: opacity 0.15s, border-color 0.15s, background 0.15s; border: 1px solid transparent; }
.element-row-dragging { opacity: 0.4; cursor: grabbing; }
.element-row-dragover { border-color: #1f78ff; background: rgba(31,120,255,0.08); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
