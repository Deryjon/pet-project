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

const activeItemsCount = computed(() => items.value.filter((item) => item.is_active).length);
const canSubmit = computed(() => Boolean(form.name.trim()) && !submitting.value);

const activeItems = computed(() =>
  items.value
    .filter((item) => item.is_active)
    .sort((a, b) => Number(a.sequence_number ?? 0) - Number(b.sequence_number ?? 0)),
);

const groupedItems = computed(() => {
  const groups = new Map<string, ChequeItem[]>();
  for (const item of items.value) {
    const blockType = item.cheque_option?.block_type || "other";
    const group = groups.get(blockType) ?? [];
    group.push(item);
    groups.set(blockType, group);
  }
  return Array.from(groups.entries()).map(([blockType, group]) => ({
    blockType,
    title: blockTitle(blockType),
    items: [...group].sort((a, b) => Number(a.sequence_number ?? 0) - Number(b.sequence_number ?? 0)),
  }));
});

function blockTitle(blockType: string) {
  switch (blockType) {
    case "information_block": return "Информационный блок";
    case "lower_block": return "Нижний блок";
    case "customer_balance": return "Баланс клиента";
    case "customer_debt": return "Долг клиента";
    default: return blockType || "Другие блоки";
  }
}

function itemName(item: ChequeItem) {
  return item.cheque_option?.name || item.cheque_option_id || "Блок чека";
}

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

function moveItem(item: ChequeItem, direction: -1 | 1) {
  const ordered = [...items.value].sort((a, b) => Number(a.sequence_number ?? 0) - Number(b.sequence_number ?? 0));
  const index = ordered.findIndex((entry) => entry === item || entry.cheque_option_id === item.cheque_option_id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;
  const current = ordered[index];
  const next = ordered[nextIndex];
  if (!current || !next) return;
  const currentSequence = current.sequence_number ?? index + 1;
  current.sequence_number = next.sequence_number ?? nextIndex + 1;
  next.sequence_number = currentSequence;
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

        <!-- Блоки чека -->
        <section class="panel">
          <div class="panel-head">
            <h2>Блоки чека</h2>
            <p>Активно: {{ activeItemsCount }} из {{ items.length }}</p>
          </div>
          <div v-if="!items.length" class="empty-block">Нет блоков в выбранном шаблоне.</div>
          <div v-else class="groups">
            <section v-for="group in groupedItems" :key="group.blockType" class="item-group">
              <h3>{{ group.title }}</h3>
              <div v-for="item in group.items" :key="item.cheque_option_id" class="cheque-item">
                <label class="item-toggle">
                  <input v-model="item.is_active" type="checkbox" />
                  <span>{{ itemName(item) }}</span>
                </label>
                <span class="sequence">№ {{ item.sequence_number }}</span>
                <div class="order-actions">
                  <button type="button" class="icon-button" @click="moveItem(item, -1)"><Icon name="heroicons:arrow-up" class="h-4 w-4" /></button>
                  <button type="button" class="icon-button" @click="moveItem(item, 1)"><Icon name="heroicons:arrow-down" class="h-4 w-4" /></button>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>

      <!-- ПРЕВЬЮ ЧЕКА -->
      <aside class="side-panel">
        <section class="panel preview-panel">
          <div class="panel-head">
            <h2>Предпросмотр</h2>
          </div>
          <div class="receipt" :style="{ maxWidth: form.compact ? '240px' : '320px' }">
            <div v-if="form.has_logo" class="receipt-logo">
              <Icon name="heroicons:photo" class="h-8 w-8 text-[#666]" />
            </div>
            <div class="receipt-header">
              <strong>{{ form.name || "Название чека" }}</strong>
            </div>
            <div v-if="form.has_information_block" class="receipt-section">
              <template v-for="item in activeItems" :key="item.cheque_option_id">
                <div v-if="(item.cheque_option?.block_type || '') === 'information_block'" class="receipt-row">
                  <span class="receipt-label">{{ itemName(item) }}</span>
                  <span class="receipt-dots"></span>
                  <span class="receipt-value">—</span>
                </div>
              </template>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-section">
              <div class="receipt-row receipt-row-bold">
                <span>Товар</span>
                <span>Сумма</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Пример товара x1</span>
                <span class="receipt-dots"></span>
                <span class="receipt-value">50 000</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Другой товар x2</span>
                <span class="receipt-dots"></span>
                <span class="receipt-value">120 000</span>
              </div>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-row receipt-row-bold receipt-total">
              <span>ИТОГО</span>
              <span>170 000 UZS</span>
            </div>
            <div v-if="form.has_customer_balance" class="receipt-row receipt-extra">
              <span>Баланс клиента</span>
              <span>0 UZS</span>
            </div>
            <div v-if="form.has_customer_debt" class="receipt-row receipt-extra">
              <span>Долг клиента</span>
              <span>0 UZS</span>
            </div>
            <div v-if="form.has_bar_code" class="receipt-barcode">
              <div class="barcode-placeholder">
                <span>||||| |||| ||| |||| |||||</span>
              </div>
            </div>
            <div v-if="form.display_text || form.has_lower_block" class="receipt-footer">
              {{ form.display_text || "Спасибо за вашу покупку!" }}
            </div>
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

.create-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 18px; }
.settings-stack, .groups { display: grid; gap: 16px; }
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
.item-group { border-radius: 18px; background: #1f1f1f; padding: 14px; }
.item-group h3 { margin-bottom: 10px; color: #9dccff; font-size: 15px; font-weight: 800; }
.cheque-item { display: grid; grid-template-columns: minmax(180px, 1fr) 80px auto; gap: 10px; align-items: center; padding: 10px 0; }
.cheque-item + .cheque-item { border-top: 1px solid rgba(255, 255, 255, 0.08); }
.item-toggle { gap: 10px; font-weight: 700; }
.sequence { color: #bdbdbd; font-size: 13px; }
.order-actions { gap: 6px; }
.icon-button, .primary-button, .ghost-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; border-radius: 14px; padding: 0 14px; font-weight: 800; border: 0; cursor: pointer; }
.icon-button { width: 42px; padding: 0; background: #404040; color: white; }
.primary-button { background: #1f78ff; color: white; }
.ghost-button { background: #404040; color: white; }
.primary-button:disabled { cursor: not-allowed; opacity: 0.55; }
.state, .empty-block { display: flex; align-items: center; justify-content: center; min-height: 240px; gap: 10px; color: #bdbdbd; }
.state-error { color: #fecaca; }

/* Preview panel */
.side-panel { position: sticky; top: 96px; align-self: start; }
.preview-panel { padding: 22px; display: flex; flex-direction: column; align-items: center; }
.receipt { width: 100%; background: #fff; color: #111; border-radius: 4px; padding: 20px 16px; font-family: "Courier New", monospace; font-size: 12px; line-height: 1.6; }
.receipt-logo { text-align: center; margin-bottom: 12px; padding: 12px; background: #f5f5f5; border-radius: 4px; }
.receipt-header { text-align: center; margin-bottom: 12px; font-size: 14px; }
.receipt-section { margin: 8px 0; }
.receipt-row { display: flex; align-items: baseline; gap: 4px; padding: 2px 0; }
.receipt-row-bold { font-weight: 700; }
.receipt-label { white-space: nowrap; }
.receipt-dots { flex: 1; border-bottom: 1px dotted #999; margin: 0 4px; min-width: 16px; height: 1em; }
.receipt-value { white-space: nowrap; text-align: right; }
.receipt-divider { border-top: 1px dashed #999; margin: 8px 0; }
.receipt-total { font-size: 14px; margin: 8px 0; justify-content: space-between; }
.receipt-extra { font-size: 11px; color: #666; justify-content: space-between; }
.receipt-barcode { text-align: center; margin: 12px 0 4px; font-size: 18px; letter-spacing: 2px; color: #333; }
.barcode-placeholder { padding: 8px; background: #f9f9f9; border-radius: 4px; }
.receipt-footer { text-align: center; margin-top: 12px; font-size: 11px; color: #666; font-style: italic; }

@media (max-width: 1180px) { .create-layout { grid-template-columns: 1fr; } .side-panel { position: static; } }
@media (max-width: 760px) { .page-header { flex-direction: column; align-items: stretch; } .form-grid, .toggle-grid { grid-template-columns: 1fr; } .cheque-item { grid-template-columns: 1fr; } }
</style>
