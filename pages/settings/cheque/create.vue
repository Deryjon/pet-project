<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useHead, useRouter } from "#imports";
import { useCheques, type Cheque, type ChequeItem } from "@/composables/useCheques";

useHead({ title: "Создать чек | Konkurent" });

const router = useRouter();
const toast = useToast();
const { getCheques, getChequeById, createCheque } = useCheques();

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const sourceCheque = ref<Cheque | null>(null);
const allCheques = ref<Cheque[]>([]);
const selectedSourceId = ref("");
const items = ref<ChequeItem[]>([]);

const form = reactive({
  name: "",
  width: 80,
  length: 0,
  x_axis: 0,
  y_axis: 0,
  rotation: 0,
  compact: false,
  is_default: false,
  has_logo: false,
  has_information_block: true,
  has_additional_info: true,
  has_lower_block: true,
  has_bar_code: true,
  has_customer_debt: false,
  has_customer_balance: false,
  printed_with_billz: false,
  display_text: "",
});

const extra = reactive({
  phone: "", address: "", workingHours: "", website: "",
  qrCodeUrl: "", branchName: "", taxId: "",
  hasPhone: false, hasAddress: false, hasWorkingHours: false,
  hasQrCode: false, hasTaxId: false, hasBranchName: false, hasWebsite: false,
});

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
  const merged: ReceiptElementStyle[] = [];
  const usedIds = new Set<string>();
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
  for (const d of DEFAULT_RECEIPT_ELEMENTS) {
    if (!usedIds.has(d.id)) {
      merged.push({ ...d, order: merged.length });
    }
  }
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

function fmtMoney(v: number) {
  return Math.round(v).toLocaleString("ru-RU") + " UZS";
}

const receiptWidthPx = computed(() => {
  return form.compact || (form.width ?? 80) <= 58 ? 220 : 302;
});

// ─── Existing logic ─────────────────────────────────────────────────────────
const activeItemsCount = computed(() => items.value.filter((item) => item.is_active).length);
const canSubmit = computed(() => Boolean(form.name.trim()) && !submitting.value);

function normalizeSourceItems(sourceItems: ChequeItem[]) {
  return sourceItems
    .filter((item) => item.cheque_option_id || item.cheque_option?.id)
    .map((item, index) => ({
      cheque_option_id: String(item.cheque_option_id || item.cheque_option?.id || ""),
      cheque_option: item.cheque_option,
      is_active: item.is_active !== false,
      sequence_number: Number(item.sequence_number ?? index + 1),
      product_characteristic_id: item.product_characteristic_id || "",
      attribute_id: item.attribute_id || "",
    }));
}

function fillFormFromSource(cheque: Cheque) {
  form.width = Number(cheque.width || 80);
  form.length = Number(cheque.length || 0);
  form.x_axis = Number(cheque.x_axis || 0);
  form.y_axis = Number(cheque.y_axis || 0);
  form.rotation = Number(cheque.rotation || 0);
  form.compact = Boolean(cheque.compact);
  form.has_logo = Boolean(cheque.has_logo);
  form.has_information_block = cheque.has_information_block !== false;
  form.has_additional_info = cheque.has_additional_info !== false;
  form.has_lower_block = cheque.has_lower_block !== false;
  form.has_bar_code = cheque.has_bar_code !== false;
  form.has_customer_debt = Boolean(cheque.has_customer_debt);
  form.has_customer_balance = Boolean(cheque.has_customer_balance);
  form.printed_with_billz = Boolean(cheque.printed_with_billz);
  form.display_text = String(cheque.display_text || "");

  // Restore extra settings
  const es = cheque.extra_settings ?? {};
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

  // Restore element styles from source cheque
  if (es.elementStyles) {
    receiptElements.value = mergeElementStyles(es.elementStyles);
  } else {
    receiptElements.value = DEFAULT_RECEIPT_ELEMENTS.map(el => ({ ...el }));
  }
}

async function fetchDefaultCheque() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const list = await getCheques({ name: "", limit: 100, page: 1 });
    allCheques.value = list.cheques;
    const defaultFromList = list.cheques.find((item) => item.is_default) ?? list.cheques[0];

    if (!defaultFromList?.id) {
      sourceCheque.value = null;
      items.value = [];
      form.name = "Новый чек";
      return;
    }

    selectedSourceId.value = defaultFromList.id;
    await loadSourceCheque(defaultFromList.id);
  } catch (error: any) {
    sourceCheque.value = null;
    items.value = [];
    errorMessage.value = error?.data?.message || error?.message || "Не удалось загрузить чеки.";
  } finally {
    loading.value = false;
  }
}

async function loadSourceCheque(id: string) {
  try {
    const detail = await getChequeById(id);
    sourceCheque.value = detail;
    items.value = normalizeSourceItems(detail.cheque_items ?? []);
    fillFormFromSource(detail);
  } catch {
    sourceCheque.value = null;
    items.value = [];
  }
}

async function onSourceChange() {
  if (!selectedSourceId.value) return;
  loading.value = true;
  await loadSourceCheque(selectedSourceId.value);
  loading.value = false;
}

function buildPayload() {
  return {
    name: form.name.trim(),
    type: "cheque",
    width: Number(form.width || 80),
    length: Number(form.length || 0),
    x_axis: Number(form.x_axis || 0),
    y_axis: Number(form.y_axis || 0),
    rotation: Number(form.rotation || 0),
    compact: Boolean(form.compact),
    is_default: Boolean(form.is_default),
    has_logo: Boolean(form.has_logo),
    has_information_block: Boolean(form.has_information_block),
    has_additional_info: Boolean(form.has_additional_info),
    has_lower_block: Boolean(form.has_lower_block),
    has_bar_code: Boolean(form.has_bar_code),
    has_customer_debt: Boolean(form.has_customer_debt),
    has_customer_balance: Boolean(form.has_customer_balance),
    printed_with_billz: Boolean(form.printed_with_billz),
    display_text: form.display_text,
    extra_settings: {
      ...extra,
      elementStyles: receiptElements.value.map(el => ({ ...el })),
    },
    cheque_items: items.value
      .filter((item) => item.cheque_option_id)
      .map((item, index) => ({
        cheque_option_id: String(item.cheque_option_id),
        is_active: item.is_active !== false,
        sequence_number: Number(item.sequence_number ?? index + 1),
        product_characteristic_id: item.product_characteristic_id || undefined,
        attribute_id: item.attribute_id || undefined,
      })),
  };
}

async function submit() {
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    const created = await createCheque(buildPayload());
    toast.add({ title: "Чек создан", color: "success" });
    if (created?.id) {
      await router.push(`/settings/cheque/${encodeURIComponent(created.id)}`);
      return;
    }
    await router.push("/settings/cheque");
  } catch (error: any) {
    toast.add({ title: "Не удалось создать чек", description: error?.data?.message || error?.message || "Ошибка", color: "error" });
  } finally {
    submitting.value = false;
  }
}

watch(() => form.compact, (compact) => { form.width = compact ? 58 : 80; });

fetchDefaultCheque();
</script>

<template>
  <section class="cheque-create-page">
    <header class="page-header">
      <button type="button" class="ghost-button" @click="router.push('/settings/cheque')">
        <Icon name="heroicons:chevron-left" class="h-5 w-5" />
        Назад
      </button>
      <div class="header-title">
        <p class="kicker">Чеки</p>
        <h1>Создать чек</h1>
        <p class="subtitle">Выберите шаблон, настройте блоки и сохраните новый чек.</p>
      </div>
      <button type="button" class="primary-button" :disabled="!canSubmit" @click="submit">
        <Icon v-if="submitting" name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
        <Icon v-else name="heroicons:check-20-solid" class="h-5 w-5" />
        Создать
      </button>
    </header>

    <div v-if="loading" class="state">
      <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
      Загружаем...
    </div>
    <div v-else-if="errorMessage" class="state state-error">{{ errorMessage }}</div>

    <div v-else class="create-layout">
      <div class="settings-stack">
        <!-- Выбор шаблона -->
        <section v-if="allCheques.length > 1" class="panel">
          <div class="panel-head">
            <h2>Шаблон</h2>
            <p>Выберите чек-основу для нового</p>
          </div>
          <div class="template-list">
            <button
              v-for="ch in allCheques" :key="ch.id" type="button"
              :class="['template-card', selectedSourceId === ch.id ? 'template-card-active' : '']"
              @click="selectedSourceId = ch.id; onSourceChange()"
            >
              <Icon name="heroicons:document-text" class="h-5 w-5" />
              <div class="template-info">
                <span class="template-name">{{ ch.name }}</span>
                <span v-if="ch.is_default" class="template-badge">По умолчанию</span>
              </div>
              <Icon v-if="selectedSourceId === ch.id" name="heroicons:check-circle-20-solid" class="h-5 w-5 text-[#1f78ff]" />
            </button>
          </div>
        </section>

        <!-- Основные данные -->
        <section class="panel">
          <div class="panel-head">
            <h2>Основные данные</h2>
          </div>
          <div class="form-grid">
            <label class="field"><span>Название</span><input v-model="form.name" type="text" placeholder="Например, Чек для доставки" /></label>
            <label class="field"><span>Ширина (мм)</span><input v-model.number="form.width" type="number" min="1" /></label>
          </div>
          <div class="toggle-grid">
            <label class="switch-row"><span>По умолчанию</span><input v-model="form.is_default" type="checkbox" /></label>
            <label class="switch-row"><span>Компактный</span><input v-model="form.compact" type="checkbox" /></label>
            <label class="switch-row"><span>Логотип</span><input v-model="form.has_logo" type="checkbox" /></label>
            <label class="switch-row"><span>Штрихкод</span><input v-model="form.has_bar_code" type="checkbox" /></label>
            <label class="switch-row"><span>Инфо блок</span><input v-model="form.has_information_block" type="checkbox" /></label>
            <label class="switch-row"><span>Доп. информация</span><input v-model="form.has_additional_info" type="checkbox" /></label>
            <label class="switch-row"><span>Нижний блок</span><input v-model="form.has_lower_block" type="checkbox" /></label>
            <label class="switch-row"><span>Долг клиента</span><input v-model="form.has_customer_debt" type="checkbox" /></label>
            <label class="switch-row"><span>Баланс клиента</span><input v-model="form.has_customer_balance" type="checkbox" /></label>
          </div>
        </section>

        <!-- Нижний текст -->
        <section class="panel">
          <div class="panel-head">
            <h2>Нижний текст</h2>
          </div>
          <textarea v-model="form.display_text" class="textarea" rows="3" placeholder="Спасибо за вашу покупку!" />
        </section>

        <!-- Порядок элементов -->
        <section class="panel">
          <div class="panel-head">
            <h2>Элементы чека</h2>
            <p>Перетаскивайте для изменения порядка</p>
          </div>
          <div class="elements-list">
            <div
              v-for="el in sortedAllElements"
              :key="el.id"
              draggable="true"
              class="element-item element-row"
              :class="{
                'element-row-dragging': sidebarDragItem?.id === el.id,
                'element-row-dragover': sidebarDragOverItem?.id === el.id,
                'element-item-selected': selectedElement?.id === el.id,
              }"
              @click="selectedElement = el"
              @dragstart="onSidebarDragStart($event, el)"
              @dragover.prevent="onSidebarDragOver($event, el)"
              @drop.prevent="onSidebarDrop(el)"
              @dragend="sidebarDragItem = null"
            >
              <label class="item-toggle" @click.stop>
                <input v-model="el.visible" type="checkbox" />
                <span>{{ el.label }}</span>
              </label>
              <div class="order-actions">
                <button type="button" class="icon-button" @click.stop="moveElementOrder(el, -1)"><Icon name="heroicons:arrow-up" class="h-4 w-4" /></button>
                <button type="button" class="icon-button" @click.stop="moveElementOrder(el, 1)"><Icon name="heroicons:arrow-down" class="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ПРЕВЬЮ ЧЕКА -->
      <aside class="side-panel">
        <section class="panel preview-panel">
          <!-- Toolbar -->
          <div class="toolbar">
            <template v-if="selectedElement">
              <span class="toolbar-label">{{ selectedElement.label }}</span>
              <div class="toolbar-divider" />
              <template v-if="!selectedElement.id.startsWith('hr')">
                <label class="toolbar-control">
                  Размер
                  <input type="number" min="8" max="24" v-model.number="selectedElement.fontSize" class="toolbar-input" />
                  pt
                </label>
                <label class="toolbar-control toolbar-check">
                  <input type="checkbox" :checked="selectedElement.fontWeight === 'bold'" @change="toggleElementBold" />
                  Жирный
                </label>
                <div class="toolbar-divider" />
              </template>
              <label class="toolbar-control">
                Отступ
                <input type="number" min="0" max="40" v-model.number="selectedElement.marginBottom" class="toolbar-input" />
                px
              </label>
            </template>
            <span v-else class="toolbar-hint">Кликните на элемент в чеке</span>
          </div>

          <!-- Torn top -->
          <div :style="{ width: receiptWidthPx + 'px', margin: '0 auto' }" class="overflow-hidden h-3 -mb-px">
            <svg viewBox="0 0 300 12" preserveAspectRatio="none" class="w-full h-full">
              <path d="M0,12 Q7.5,0 15,12 Q22.5,0 30,12 Q37.5,0 45,12 Q52.5,0 60,12 Q67.5,0 75,12 Q82.5,0 90,12 Q97.5,0 105,12 Q112.5,0 120,12 Q127.5,0 135,12 Q142.5,0 150,12 Q157.5,0 165,12 Q172.5,0 180,12 Q187.5,0 195,12 Q202.5,0 210,12 Q217.5,0 225,12 Q232.5,0 240,12 Q247.5,0 255,12 Q262.5,0 270,12 Q277.5,0 285,12 Q292.5,0 300,12" fill="white"/>
            </svg>
          </div>

          <div class="receipt" :style="{ maxWidth: receiptWidthPx + 'px' }">
            <!-- Logo -->
            <div v-if="form.has_logo" class="receipt-logo">
              <Icon name="heroicons:photo" class="h-8 w-8 text-[#666]" />
            </div>

            <!-- Interactive receipt elements -->
            <div
              v-for="el in sortedVisibleElements"
              :key="el.id"
              class="receipt-element"
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
              <div v-if="el.id === 'shopName'" class="text-center">{{ form.name || 'Название магазина' }}</div>
              <div v-else-if="el.id === 'branch'" class="text-center" style="color:#666;">{{ extra.branchName || 'Филиал' }}</div>
              <div v-else-if="el.id === 'address'" class="text-center" style="color:#666;">{{ extra.address || 'Адрес' }}</div>
              <div v-else-if="el.id === 'phone'" class="text-center" style="color:#666;">{{ extra.phone || 'Телефон' }}</div>
              <div v-else-if="el.id === 'workingHours'" class="text-center" style="color:#666;">{{ extra.workingHours || 'Часы работы' }}</div>
              <div v-else-if="el.id === 'website'" class="text-center" style="color:#666;">{{ extra.website || 'Сайт' }}</div>
              <div v-else-if="el.id.startsWith('hr')" class="receipt-divider" />
              <div v-else-if="el.id === 'chequeNumber'" class="receipt-row" style="color:#555;"><span>Чек #TEST-001</span></div>
              <div v-else-if="el.id === 'date'" style="color:#555;">{{ nowStr }}</div>
              <div v-else-if="el.id === 'taxId'" style="color:#555;">ИНН: {{ extra.taxId || '123456789' }}</div>
              <div v-else-if="el.id === 'seller'" style="color:#555;">Продавец: Иванов И.</div>
              <div v-else-if="el.id === 'cashier'" style="color:#555;">Кассир: —</div>
              <div v-else-if="el.id === 'client'" style="color:#555;">Клиент: —</div>
              <div v-else-if="el.id === 'items'">
                <div v-for="line in previewLines" :key="line.name" style="margin-bottom:4px;">
                  <div style="font-weight:600;">{{ line.name }}</div>
                  <div class="receipt-row" style="font-size:11px;color:#555;">
                    <span>{{ line.quantity }} шт x {{ fmtMoney(line.price) }}</span>
                    <span style="font-weight:700;color:#111;">{{ fmtMoney(line.total) }}</span>
                  </div>
                </div>
              </div>
              <div v-else-if="el.id === 'total'" class="receipt-row receipt-row-bold receipt-total">
                <span>ИТОГО</span><span>{{ fmtMoney(previewTotal) }}</span>
              </div>
              <div v-else-if="el.id === 'payment'" class="receipt-row" style="color:#555;">
                <span>Наличные</span><span>{{ fmtMoney(previewTotal) }}</span>
              </div>
              <div v-else-if="el.id === 'debt'" class="receipt-row receipt-extra">
                <span>Долг клиента</span><span>0 UZS</span>
              </div>
              <div v-else-if="el.id === 'balance'" class="receipt-row receipt-extra">
                <span>Баланс</span><span>0 UZS</span>
              </div>
              <div v-else-if="el.id === 'barcode'" class="receipt-barcode">
                <div class="barcode-placeholder"><span>||||| |||| ||| |||| |||||</span></div>
                <div style="font-size:10px;color:#666;text-align:center;margin-top:2px;">1234567890123</div>
              </div>
              <div v-else-if="el.id === 'footer'" class="receipt-footer">{{ form.display_text || 'Спасибо за покупку!' }}</div>
              <div v-else-if="el.id === 'qrCode'" style="text-align:center;">
                <div style="width:60px;height:60px;border:1px dashed #ccc;display:inline-flex;align-items:center;justify-content:center;color:#ccc;font-size:10px;border-radius:4px;">QR</div>
                <div v-if="extra.qrCodeUrl" style="font-size:10px;color:#999;margin-top:4px;word-break:break-all;">{{ extra.qrCodeUrl }}</div>
              </div>
            </div>
          </div>

          <!-- Torn bottom -->
          <div :style="{ width: receiptWidthPx + 'px', margin: '0 auto' }" class="overflow-hidden h-3 -mt-px">
            <svg viewBox="0 0 300 12" preserveAspectRatio="none" class="w-full h-full">
              <path d="M0,0 Q7.5,12 15,0 Q22.5,12 30,0 Q37.5,12 45,0 Q52.5,12 60,0 Q67.5,12 75,0 Q82.5,12 90,0 Q97.5,12 105,0 Q112.5,12 120,0 Q127.5,12 135,0 Q142.5,12 150,0 Q157.5,12 165,0 Q172.5,12 180,0 Q187.5,12 195,0 Q202.5,12 210,0 Q217.5,12 225,0 Q232.5,12 240,0 Q247.5,12 255,0 Q262.5,12 270,0 Q277.5,12 285,0 Q292.5,12 300,0" fill="white"/>
            </svg>
          </div>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.cheque-create-page { color: white; }
.page-header, .order-actions, .item-toggle { display: flex; align-items: center; }
.page-header { gap: 16px; margin-bottom: 22px; }
.header-title { min-width: 0; flex: 1; }
.kicker { color: #79b7ff; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
h1 { margin-top: 6px; font-size: 30px; font-weight: 800; }
.subtitle { margin-top: 6px; color: #bdbdbd; line-height: 1.5; }

.create-layout { display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 18px; }
.settings-stack { display: grid; gap: 16px; }
.panel { border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; background: #262626; padding: 22px; }
.panel-head { margin-bottom: 18px; }
.panel-head h2 { font-size: 20px; font-weight: 800; }
.panel-head p { margin-top: 5px; color: #9b9b9b; line-height: 1.5; }

/* Template selector */
.template-list { display: grid; gap: 8px; }
.template-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 16px; background: #1f1f1f; border: 1px solid transparent; text-align: left; color: #d7d7d7; transition: border-color 0.2s, background 0.2s; cursor: pointer; }
.template-card:hover { background: #2a2a2a; border-color: rgba(255,255,255,0.1); }
.template-card-active { border-color: #1f78ff; background: rgba(31,120,255,0.1); }
.template-info { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; }
.template-name { font-weight: 700; font-size: 14px; }
.template-badge { font-size: 11px; padding: 2px 8px; border-radius: 8px; background: rgba(31,120,255,0.2); color: #79b7ff; font-weight: 600; }

.form-grid, .toggle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.toggle-grid { margin-top: 16px; }
.field { display: grid; gap: 8px; }
.field span { color: #d7d7d7; font-size: 13px; font-weight: 700; }
.field input, .textarea { width: 100%; border: 1px solid #404040; border-radius: 14px; background: #1f1f1f; color: white; outline: none; }
.field input { min-height: 44px; padding: 0 12px; }
.textarea { padding: 12px; resize: vertical; }
.switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; border-radius: 14px; background: #1f1f1f; padding: 0 12px; color: #d7d7d7; font-size: 13px; font-weight: 700; }
.switch-row input, .item-toggle input { width: 18px; height: 18px; accent-color: #1f78ff; }

/* Elements list */
.elements-list { display: grid; gap: 4px; }
.element-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; background: #1f1f1f; }
.element-item-selected { background: rgba(31,120,255,0.1); border-color: rgba(31,120,255,0.3); }
.item-toggle { gap: 10px; font-weight: 700; flex: 1; }
.order-actions { display: flex; gap: 6px; }
.icon-button, .primary-button, .ghost-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; border-radius: 14px; padding: 0 14px; font-weight: 800; border: 0; cursor: pointer; }
.icon-button { width: 36px; min-height: 36px; padding: 0; background: #404040; color: white; }
.primary-button { background: #1f78ff; color: white; }
.ghost-button { background: #404040; color: white; }
.primary-button:disabled { cursor: not-allowed; opacity: 0.55; }
.state, .empty-block { display: flex; align-items: center; justify-content: center; min-height: 240px; gap: 10px; color: #bdbdbd; }
.state-error { color: #fecaca; }

/* Toolbar */
.toolbar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; margin-bottom: 12px; border-radius: 12px; background: #1f1f1f; min-height: 40px; flex-wrap: wrap; }
.toolbar-label { font-size: 12px; color: #aaa; font-weight: 600; }
.toolbar-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.1); }
.toolbar-control { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #888; }
.toolbar-check { cursor: pointer; }
.toolbar-check input { width: 14px; height: 14px; accent-color: #1f78ff; }
.toolbar-input { width: 48px; padding: 3px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: #2a2a2a; color: white; font-size: 12px; outline: none; }
.toolbar-input:focus { border-color: #1f78ff; }
.toolbar-hint { font-size: 11px; color: #555; }

/* Preview panel */
.side-panel { position: sticky; top: 96px; align-self: start; }
.preview-panel { padding: 22px; display: flex; flex-direction: column; align-items: center; }
.receipt { width: 100%; background: #fff; color: #111; border-radius: 0; padding: 20px 16px; font-family: "Courier New", monospace; font-size: 12px; line-height: 1.6; margin: 0 auto; }
.receipt-element { cursor: pointer; transition: outline-color 0.15s; }
.receipt-logo { text-align: center; margin-bottom: 12px; padding: 12px; background: #f5f5f5; border-radius: 4px; }
.receipt-row { display: flex; align-items: baseline; justify-content: space-between; gap: 4px; padding: 2px 0; }
.receipt-row-bold { font-weight: 700; }
.receipt-divider { border-top: 1px dashed #999; margin: 8px 0; }
.receipt-total { font-size: 14px; margin: 8px 0; }
.receipt-extra { font-size: 11px; color: #666; }
.receipt-barcode { text-align: center; margin: 4px 0; font-size: 18px; letter-spacing: 2px; color: #333; }
.barcode-placeholder { padding: 8px; background: #f9f9f9; border-radius: 4px; }
.receipt-footer { text-align: center; margin-top: 8px; font-size: 11px; color: #666; font-style: italic; }

.element-row { cursor: grab; transition: opacity 0.15s, border-color 0.15s, background 0.15s; border: 1px solid transparent; }
.element-row-dragging { opacity: 0.4; cursor: grabbing; }
.element-row-dragover { border-color: #1f78ff !important; background: rgba(31,120,255,0.08); }

@media (max-width: 1180px) { .create-layout { grid-template-columns: 1fr; } .side-panel { position: static; } }
@media (max-width: 760px) { .page-header { flex-direction: column; align-items: stretch; } .form-grid, .toggle-grid { grid-template-columns: 1fr; } }
</style>
