<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import {
  useCheques,
  type Cheque,
  type ChequeItem,
  type ProductCharacteristic,
} from "@/composables/useCheques";

useHead({ title: "Редактирование чека | Konkurent" });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { getChequeById, getProductCharacteristics, updateCheque } = useCheques();

const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const cheque = ref<Cheque | null>(null);
const characteristics = ref<ProductCharacteristic[]>([]);

const form = ref<Partial<Cheque>>({});

const chequeId = computed(() => String(route.params.id || ""));
const activeItemsCount = computed(() =>
  (form.value.cheque_items ?? []).filter((item) => item.is_active).length,
);
const previewLines = computed(() => [
  { name: "Чехол iPhone 12", quantity: 1, price: 50000, total: 50000 },
  { name: "Стекло Samsung S22", quantity: 2, price: 80000, total: 160000 },
]);
const previewTotal = computed(() =>
  previewLines.value.reduce((sum, line) => sum + line.total, 0),
);
const previewWidthClass = computed(() => {
  const width = Number(form.value.width || 0);
  return form.value.compact || width <= 58 ? "receipt-paper-58" : "receipt-paper-80";
});
const activePreviewItems = computed(() =>
  (form.value.cheque_items ?? [])
    .filter((item) => item.is_active)
    .sort((a, b) => Number(a.sequence_number ?? 0) - Number(b.sequence_number ?? 0))
    .slice(0, 8),
);

const groupedItems = computed(() => {
  const groups = new Map<string, ChequeItem[]>();

  for (const item of form.value.cheque_items ?? []) {
    const key = item.cheque_option?.block_type || "other";
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return Array.from(groups.entries()).map(([blockType, items]) => ({
    blockType,
    title: blockTitle(blockType),
    items: [...items].sort(
      (a, b) => Number(a.sequence_number ?? 0) - Number(b.sequence_number ?? 0),
    ),
  }));
});

const characteristicOptions = computed(() =>
  characteristics.value
    .filter((item) => !item.deleted_at)
    .map((item) => ({
      label: `${item.name} (${item.system_name})`,
      value: item.id,
    })),
);

function cloneCheque(input: Cheque) {
  return JSON.parse(JSON.stringify(input)) as Cheque;
}

function blockTitle(blockType: string) {
  switch (blockType) {
    case "information_block":
      return "Информационный блок";
    case "lower_block":
      return "Нижний блок";
    case "customer_balance":
      return "Баланс клиента";
    case "customer_debt":
      return "Долг клиента";
    default:
      return blockType || "Другие блоки";
  }
}

function itemName(item: ChequeItem) {
  return item.cheque_option?.name || item.cheque_option_id || "Блок чека";
}

function formatMoney(value: number) {
  return `${Math.round(Number(value || 0)).toLocaleString("ru-RU")} UZS`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPreviewHtml() {
  const width = previewWidthClass.value === "receipt-paper-58" ? "58mm" : "80mm";
  const productRows = previewLines.value
    .map(
      (line) => `
        <tr>
          <td>
            <strong>${escapeHtml(line.name)}</strong>
            <span>${line.quantity} x ${escapeHtml(formatMoney(line.price))}</span>
          </td>
          <td>${escapeHtml(formatMoney(line.total))}</td>
        </tr>
      `,
    )
    .join("");
  const blocks = activePreviewItems.value
    .map((item) => `<div class="muted">${escapeHtml(itemName(item))}</div>`)
    .join("");

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Тестовый чек</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; background: white; color: #111; font-family: Arial, sans-serif; }
          .receipt { width: ${width}; padding: 10px; font-size: 12px; }
          .center { text-align: center; }
          .muted { color: #555; }
          .line { border-top: 1px dashed #111; margin: 10px 0; }
          .logo { border: 1px solid #111; padding: 8px; text-align: center; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; }
          td { vertical-align: top; padding: 4px 0; }
          td:last-child { text-align: right; white-space: nowrap; }
          td span { display: block; margin-top: 2px; color: #555; }
          .total { display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; }
          .barcode { margin-top: 10px; text-align: center; letter-spacing: 3px; }
          @page { margin: 0; size: ${width} auto; }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${form.value.has_logo ? `<div class="logo">LOGO</div>` : ""}
          <div class="center"><strong>${escapeHtml(form.value.name || "Чек")}</strong></div>
          ${form.value.has_information_block ? `<div class="center muted">Konkurent.cases</div>` : ""}
          <div class="line"></div>
          <div>Чек: TEST-001</div>
          <div>Дата: ${escapeHtml(new Date().toLocaleString("ru-RU"))}</div>
          ${blocks ? `<div class="line"></div>${blocks}` : ""}
          <div class="line"></div>
          <table>${productRows}</table>
          <div class="line"></div>
          <div class="total"><span>Итого</span><span>${escapeHtml(formatMoney(previewTotal.value))}</span></div>
          ${
            form.value.has_lower_block && form.value.display_text
              ? `<div class="line"></div><div class="center">${escapeHtml(form.value.display_text)}</div>`
              : ""
          }
          ${form.value.has_bar_code ? `<div class="barcode">|||| |||| ||||</div>` : ""}
        </div>
      </body>
    </html>`;
}

function printTestCheque() {
  if (!import.meta.client) return;

  const printWindow = window.open("", "_blank", "width=420,height=720");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(buildPreviewHtml());
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

function moveItem(item: ChequeItem, direction: -1 | 1) {
  const items = form.value.cheque_items ?? [];
  const sameBlock = items
    .filter((entry) => entry.cheque_option?.block_type === item.cheque_option?.block_type)
    .sort((a, b) => Number(a.sequence_number ?? 0) - Number(b.sequence_number ?? 0));
  const index = sameBlock.findIndex((entry) => entry === item || entry.id === item.id);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= sameBlock.length) return;

  const currentSequence = sameBlock[index].sequence_number ?? index + 1;
  sameBlock[index].sequence_number = sameBlock[nextIndex].sequence_number ?? nextIndex + 1;
  sameBlock[nextIndex].sequence_number = currentSequence;
}

function buildUpdatePayload() {
  return {
    name: String(form.value.name || "").trim(),
    has_logo: Boolean(form.value.has_logo),
    has_information_block: Boolean(form.value.has_information_block),
    has_additional_info: Boolean(form.value.has_additional_info),
    has_lower_block: Boolean(form.value.has_lower_block),
    display_text: String(form.value.display_text || ""),
    has_bar_code: Boolean(form.value.has_bar_code),
    is_default: Boolean(form.value.is_default),
    type: String(form.value.type || "cheque"),
    has_additional_image: Boolean(form.value.has_additional_image),
    has_customer_debt: Boolean(form.value.has_customer_debt),
    has_customer_balance: Boolean(form.value.has_customer_balance),
    printed_with_billz: Boolean(form.value.printed_with_billz),
    width: Number(form.value.width || 0),
    length: Number(form.value.length || 0),
    x_axis: Number(form.value.x_axis || 0),
    y_axis: Number(form.value.y_axis || 0),
    rotation: Number(form.value.rotation || 0),
    compact: Boolean(form.value.compact),
    cheque_items: (form.value.cheque_items ?? [])
      .filter((item) => item.cheque_option_id || item.cheque_option?.id)
      .map((item, index) => ({
        id: item.id,
        cheque_option_id: String(item.cheque_option_id || item.cheque_option?.id || ""),
        product_characteristic_id: item.product_characteristic_id || "",
        attribute_id: item.attribute_id || "",
        is_active: item.is_active !== false,
        sequence_number: Number(item.sequence_number ?? index + 1),
      })),
  };
}

async function fetchData() {
  if (!chequeId.value) return;

  loading.value = true;
  errorMessage.value = "";

  try {
    const [chequeResponse, characteristicsResponse] = await Promise.all([
      getChequeById(chequeId.value),
      getProductCharacteristics(),
    ]);

    cheque.value = chequeResponse;
    form.value = cloneCheque(chequeResponse);
    characteristics.value = characteristicsResponse.product_characteristics;
  } catch (error: any) {
    cheque.value = null;
    form.value = {};
    characteristics.value = [];
    errorMessage.value = error?.data?.message || error?.message || "Не удалось загрузить чек.";
  } finally {
    loading.value = false;
  }
}

async function saveCheque() {
  if (!chequeId.value || saving.value) return;

  saving.value = true;
  try {
    const updated = await updateCheque(chequeId.value, buildUpdatePayload());
    cheque.value = updated;
    form.value = cloneCheque(updated);
    toast.add({ title: "Чек сохранен", color: "success" });
  } catch (error: any) {
    toast.add({
      title: "Не удалось сохранить чек",
      description: error?.data?.message || error?.message || "Ошибка сохранения",
      color: "error",
    });
  } finally {
    saving.value = false;
  }
}

watch(() => chequeId.value, fetchData, { immediate: true });
</script>

<template>
  <section class="cheque-edit-page">
    <header class="page-header">
      <button type="button" class="ghost-button" @click="router.push('/settings/cheque')">
        <Icon name="heroicons:chevron-left" class="h-5 w-5" />
        Назад
      </button>

      <div class="header-title">
        <p class="kicker">Чеки</p>
        <h1>{{ form.name || "Редактирование чека" }}</h1>
      </div>

      <button type="button" class="primary-button" :disabled="loading || saving || !form.id" @click="saveCheque">
        <Icon v-if="saving" name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
        <Icon v-else name="heroicons:check-20-solid" class="h-5 w-5" />
        Сохранить
      </button>
    </header>

    <div v-if="loading" class="state">
      <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
      Загружаем чек...
    </div>

    <div v-else-if="errorMessage" class="state state-error">
      {{ errorMessage }}
    </div>

    <div v-else-if="form.id" class="edit-layout">
      <aside class="side-panel">
        <section class="panel preview-panel">
          <div class="panel-head">
            <h2>Предпросмотр</h2>
            <p>Пример того, как будет выглядеть чек с текущими настройками.</p>
          </div>

          <div class="receipt-preview" :class="previewWidthClass">
            <div v-if="form.has_logo" class="preview-logo">LOGO</div>
            <div class="center strong">{{ form.name || "Чек" }}</div>
            <div v-if="form.has_information_block" class="center muted">Konkurent.cases</div>
            <div class="dash"></div>
            <div>Чек: TEST-001</div>
            <div>Дата: {{ new Date().toLocaleString("ru-RU") }}</div>

            <template v-if="activePreviewItems.length">
              <div class="dash"></div>
              <div v-for="item in activePreviewItems" :key="item.id || item.cheque_option_id" class="muted">
                {{ itemName(item) }}
              </div>
            </template>

            <div class="dash"></div>
            <div v-for="line in previewLines" :key="line.name" class="receipt-line">
              <div>
                <strong>{{ line.name }}</strong>
                <span>{{ line.quantity }} x {{ formatMoney(line.price) }}</span>
              </div>
              <b>{{ formatMoney(line.total) }}</b>
            </div>
            <div class="dash"></div>
            <div class="total-row">
              <span>Итого</span>
              <strong>{{ formatMoney(previewTotal) }}</strong>
            </div>
            <template v-if="form.has_lower_block && form.display_text">
              <div class="dash"></div>
              <div class="center">{{ form.display_text }}</div>
            </template>
            <div v-if="form.has_bar_code" class="barcode-preview">|||| |||| ||||</div>
          </div>

          <button type="button" class="test-button" @click="printTestCheque">
            <Icon name="heroicons:printer" class="h-5 w-5" />
            Тестовая печать
          </button>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Характеристики</h2>
            <p>Загружены из <code>/v2/product-characteristic</code>.</p>
          </div>

          <div class="characteristics-list">
            <div v-for="item in characteristics" :key="item.id" class="characteristic-row">
              <strong>{{ item.name }}</strong>
              <span>{{ item.system_name }}</span>
            </div>
          </div>
        </section>
      </aside>

      <div class="settings-stack">
        <section class="panel">
          <div class="panel-head">
            <h2>Основные настройки</h2>
            <p>Данные пришли из <code>/v1/cheque/{{ form.id }}</code>.</p>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>Название</span>
              <input v-model="form.name" type="text" />
            </label>
            <label class="field">
              <span>Тип</span>
              <input v-model="form.type" type="text" />
            </label>
            <label class="field">
              <span>Ширина</span>
              <input v-model.number="form.width" type="number" min="1" />
            </label>
            <label class="field">
              <span>Длина</span>
              <input v-model.number="form.length" type="number" min="1" />
            </label>
            <label class="field">
              <span>X axis</span>
              <input v-model.number="form.x_axis" type="number" />
            </label>
            <label class="field">
              <span>Y axis</span>
              <input v-model.number="form.y_axis" type="number" />
            </label>
            <label class="field">
              <span>Rotation</span>
              <input v-model.number="form.rotation" type="number" />
            </label>
          </div>

          <div class="toggle-grid">
            <label class="switch-row">
              <span>Default</span>
              <input v-model="form.is_default" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Compact</span>
              <input v-model="form.compact" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Logo</span>
              <input v-model="form.has_logo" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Barcode</span>
              <input v-model="form.has_bar_code" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Information block</span>
              <input v-model="form.has_information_block" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Additional info</span>
              <input v-model="form.has_additional_info" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Lower block</span>
              <input v-model="form.has_lower_block" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Customer debt</span>
              <input v-model="form.has_customer_debt" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Customer balance</span>
              <input v-model="form.has_customer_balance" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Printed with Billz</span>
              <input v-model="form.printed_with_billz" type="checkbox" />
            </label>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Нижний текст</h2>
            <p>Поле <code>display_text</code> для нижнего блока чека.</p>
          </div>

          <textarea v-model="form.display_text" class="textarea" rows="4" />
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Блоки чека</h2>
            <p>
              <code>is_active</code> включает блок, <code>sequence_number</code> задает порядок.
              Активно: {{ activeItemsCount }} из {{ form.cheque_items?.length ?? 0 }}.
            </p>
          </div>

          <div v-if="!groupedItems.length" class="empty-block">Блоки не пришли в ответе.</div>

          <div v-else class="groups">
            <section v-for="group in groupedItems" :key="group.blockType" class="item-group">
              <h3>{{ group.title }}</h3>

              <div v-for="item in group.items" :key="item.id || item.cheque_option_id" class="cheque-item">
                <label class="item-toggle">
                  <input v-model="item.is_active" type="checkbox" />
                  <span>{{ itemName(item) }}</span>
                </label>

                <select v-model="item.product_characteristic_id" class="characteristic-select">
                  <option value="">Без характеристики</option>
                  <option
                    v-for="option in characteristicOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>

                <div class="order-actions">
                  <button type="button" class="icon-button" @click="moveItem(item, -1)">
                    <Icon name="heroicons:arrow-up" class="h-4 w-4" />
                  </button>
                  <button type="button" class="icon-button" @click="moveItem(item, 1)">
                    <Icon name="heroicons:arrow-down" class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>

      <aside class="side-panel">
        <section class="panel">
          <div class="panel-head">
            <h2>Характеристики</h2>
            <p>Загружены из <code>/v2/product-characteristic</code>.</p>
          </div>

          <div class="characteristics-list">
            <div v-for="item in characteristics" :key="item.id" class="characteristic-row">
              <strong>{{ item.name }}</strong>
              <span>{{ item.system_name }}</span>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.cheque-edit-page {
  color: white;
  padding-bottom: 32px;
}

.page-header,
.order-actions,
.item-toggle {
  display: flex;
  align-items: center;
}

.page-header {
  gap: 16px;
  margin-bottom: 22px;
}

.header-title {
  min-width: 0;
  flex: 1;
}

.kicker {
  color: #79b7ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  margin-top: 6px;
  overflow-wrap: anywhere;
  font-size: 30px;
  font-weight: 800;
}

.edit-layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 18px;
}

.edit-layout > .side-panel:last-child {
  display: none;
}

.settings-stack,
.groups,
.characteristics-list {
  display: grid;
  gap: 16px;
}

.panel {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  background: #262626;
  padding: 22px;
}

.panel-head {
  margin-bottom: 18px;
}

.panel-head h2 {
  font-size: 20px;
  font-weight: 800;
}

.panel-head p {
  margin-top: 5px;
  color: #9b9b9b;
  line-height: 1.5;
}

code {
  color: #9dccff;
}

.form-grid,
.toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.toggle-grid {
  margin-top: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #d7d7d7;
  font-size: 13px;
  font-weight: 700;
}

.field input,
.textarea,
.characteristic-select {
  width: 100%;
  border: 1px solid #404040;
  border-radius: 14px;
  background: #1f1f1f;
  color: white;
  outline: none;
}

.field input,
.characteristic-select {
  min-height: 44px;
  padding: 0 12px;
}

.textarea {
  padding: 12px;
  resize: vertical;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  border-radius: 14px;
  background: #1f1f1f;
  padding: 0 12px;
  color: #d7d7d7;
  font-size: 13px;
  font-weight: 700;
}

.switch-row input,
.item-toggle input {
  width: 18px;
  height: 18px;
  accent-color: #1f78ff;
}

.item-group {
  border-radius: 18px;
  background: #1f1f1f;
  padding: 14px;
}

.item-group h3 {
  margin-bottom: 10px;
  color: #9dccff;
  font-size: 15px;
  font-weight: 800;
}

.cheque-item {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
}

.cheque-item + .cheque-item {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.item-toggle {
  gap: 10px;
  font-weight: 700;
}

.order-actions {
  gap: 6px;
}

.icon-button,
.primary-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border-radius: 14px;
  padding: 0 14px;
  font-weight: 800;
}

.icon-button {
  width: 42px;
  padding: 0;
  background: #404040;
}

.primary-button {
  background: #1f78ff;
}

.ghost-button {
  background: #404040;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.state,
.empty-block {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  gap: 10px;
  color: #bdbdbd;
}

.state-error {
  color: #fecaca;
}

.side-panel {
  position: sticky;
  top: 96px;
  align-self: start;
  display: grid;
  gap: 16px;
}

.receipt-preview {
  margin: 0 auto;
  border-radius: 8px;
  background: white;
  color: #111;
  padding: 12px;
  font-family: Arial, sans-serif;
  font-size: 12px;
}

.receipt-paper-58 {
  max-width: 250px;
}

.receipt-paper-80 {
  max-width: 320px;
}

.preview-logo {
  margin-bottom: 8px;
  border: 1px solid #111;
  padding: 8px;
  text-align: center;
  font-weight: 700;
}

.center {
  text-align: center;
}

.strong {
  font-weight: 700;
}

.muted {
  color: #555;
}

.dash {
  border-top: 1px dashed #111;
  margin: 10px 0;
}

.receipt-line,
.total-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.receipt-line + .receipt-line {
  margin-top: 8px;
}

.receipt-line span {
  display: block;
  margin-top: 2px;
  color: #555;
}

.receipt-line b,
.total-row strong {
  white-space: nowrap;
}

.total-row {
  font-size: 14px;
  font-weight: 700;
}

.barcode-preview {
  margin-top: 10px;
  text-align: center;
  letter-spacing: 3px;
}

.test-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  margin-top: 16px;
  border-radius: 14px;
  background: #1f78ff;
  font-weight: 800;
}

.characteristic-row {
  display: grid;
  gap: 3px;
  border-radius: 14px;
  background: #1f1f1f;
  padding: 12px;
}

.characteristic-row span {
  color: #9b9b9b;
  font-size: 12px;
}

@media (max-width: 1180px) {
  .edit-layout {
    grid-template-columns: 1fr;
  }

  .side-panel {
    position: static;
  }
}

@media (max-width: 760px) {
  .page-header,
  .cheque-item {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }

  .form-grid,
  .toggle-grid {
    grid-template-columns: 1fr;
  }
}
</style>
