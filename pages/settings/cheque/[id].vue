<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import {
  useReceipts,
  defaultReceiptSettings,
  type ChequeBlock,
  type ChequeBlockType,
  type ReceiptData,
  type ReceiptSettingsData,
} from "@/composables/useReceipts";
import ReceiptView from "@/components/receipt/ReceiptView.vue";

const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params.id ?? ""));

useHead({ title: "Настройки чека | Konkurent" });

const toast = useToast();
const { fetchChequeTemplate, updateChequeTemplate, deleteChequeTemplate } = useReceipts();

const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const errorMessage = ref("");
const showAdvanced = ref(false);

const draft = reactive<ReceiptSettingsData>(defaultReceiptSettings());
const paperWidthPreset = computed({
  get: () => (["58", "80", "210"].includes(String(draft.paperWidth)) ? String(draft.paperWidth) : "custom"),
  set: (value: string) => {
    if (value !== "custom") draft.paperWidth = Number(value);
  },
});

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const settings = await fetchChequeTemplate(id.value);
    Object.assign(draft, settings);
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || "Не удалось загрузить настройки.";
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (saving.value) return;
  saving.value = true;
  try {
    const updated = await updateChequeTemplate(id.value, draft);
    Object.assign(draft, updated);
    toast.add({ title: "Сохранено", color: "success" });
  } catch (e: any) {
    toast.add({ title: "Ошибка сохранения", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function makeDefault() {
  if (draft.isDefault || saving.value) return;
  saving.value = true;
  try {
    const updated = await updateChequeTemplate(id.value, { isDefault: true });
    Object.assign(draft, updated);
    toast.add({ title: "Назначен шаблоном по умолчанию", color: "success" });
  } catch (e: any) {
    toast.add({ title: "Не удалось назначить", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function removeTemplate() {
  if (deleting.value || draft.isDefault) return;
  if (!confirm(`Удалить шаблон «${draft.name}»?`)) return;
  deleting.value = true;
  try {
    await deleteChequeTemplate(id.value);
    toast.add({ title: "Шаблон удалён", color: "success" });
    router.push("/settings/cheque");
  } catch (e: any) {
    toast.add({ title: "Не удалось удалить", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    deleting.value = false;
  }
}

const GROUP_BASE: Record<ChequeBlockType, number> = {
  information_block: 10,
  customer_balance: 210,
  customer_debt: 250,
  lower_block: 290,
};

function blocksOf(type: ChequeBlockType): ChequeBlock[] {
  return draft.blocks.filter((b) => b.blockType === type).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

const infoBlocks = computed(() => blocksOf("information_block"));
const balanceBlocks = computed(() => blocksOf("customer_balance"));
const debtBlocks = computed(() => blocksOf("customer_debt"));
const lowerBlocks = computed(() => blocksOf("lower_block"));

const isFooterMessageActive = computed(() => draft.blocks.find((b) => b.key === "footer_message")?.isActive ?? false);
const isFooterNoteActive = computed(() => draft.blocks.find((b) => b.key === "footer_note")?.isActive ?? false);
const isQrActive = computed(() => draft.blocks.find((b) => b.key === "qr_code")?.isActive ?? false);

const dragKey = ref<string | null>(null);

function onDragStart(key: string) {
  dragKey.value = key;
}

function onDrop(targetKey: string, group: ChequeBlock[]) {
  const fromKey = dragKey.value;
  dragKey.value = null;
  if (!fromKey || fromKey === targetKey) return;

  const order = group.map((b) => b.key);
  const from = order.indexOf(fromKey);
  const to = order.indexOf(targetKey);
  if (from === -1 || to === -1) return;
  order.splice(to, 0, order.splice(from, 1)[0]);

  const base = group[0] ? GROUP_BASE[group[0].blockType] : 0;
  order.forEach((key, idx) => {
    const block = draft.blocks.find((b) => b.key === key);
    if (block) block.sequenceNumber = base + idx * 10;
  });
}

const mockReceipt: ReceiptData = {
  id: "mock",
  saleId: 0,
  shopId: "mock",
  number: "TEST-001",
  status: "CREATED",
  createdAt: new Date().toISOString(),
  managerName: "Иванов И.",
  managerPhone: "+998 90 123 45 67",
  sellerName: "Петров П.",
  clientName: "Клиент Тестов",
  clientPhone: "+998 91 234 56 78",
  saleComment: "Подарочная упаковка",
  items: [
    { name: "Силиконовый Iphone Чехол", sku: "SKU-001", quantity: 1, price: 65000, total: 65000, discount: 0, discountPercent: 0 },
    { name: "Стекло Samsung S22", sku: "SKU-002", quantity: 2, price: 37500, total: 75000, discount: 5000, discountPercent: 6 },
  ],
  subtotal: 140000,
  discount: 5000,
  discountPercent: 4,
  cashbackEarned: 3500,
  totalDue: 135000,
  paidCash: 135000,
  paidCard: 0,
  paidCashback: 0,
  debt: 0,
  balanceBefore: 10000,
  balanceAdded: 3500,
  balanceDeducted: 0,
  balanceAfter: 13500,
  debtBefore: 0,
  debtAdded: 0,
  debtPaid: 0,
  debtAfter: 0,
  qrPayload: "https://konkurent.example/receipt/TEST-001",
  shop: {
    name: "Konkurent — Чиланзар",
    address: "г. Ташкент, ул. Навои 1",
    phone: "+998 71 200 00 00",
    workingHours: "09:00 – 22:00",
    facebook: "facebook.com/konkurent",
    instagram: "instagram.com/konkurent",
    telegram: "t.me/konkurent",
    website: "konkurent.uz",
  },
  company: { legalName: "ООО «Konkurent Cases»", taxId: "123456789" },
};

load();
</script>

<template>
  <section class="receipt-settings-page">
    <NuxtLink to="/settings/cheque" class="back-link">
      <Icon name="heroicons:arrow-left" class="h-4 w-4" />
      Все шаблоны чеков
    </NuxtLink>

    <header class="page-header">
      <div>
        <p class="kicker">Настройки</p>
        <input v-if="!loading" v-model="draft.name" class="title-input" placeholder="Название шаблона" />
        <h1 v-else>Чек</h1>
        <p class="subtitle">Настройте блоки, порядок и видимость информации на чеке. Изменения применяются сразу в превью и сохраняются только по кнопке «Сохранить».</p>
      </div>
      <div class="header-actions">
        <span v-if="draft.isDefault" class="badge-default">По умолчанию</span>
        <button v-else type="button" class="ghost-button" :disabled="saving" @click="makeDefault">Сделать по умолчанию</button>
        <button type="button" class="ghost-button danger" :disabled="draft.isDefault || deleting" @click="removeTemplate">
          <Icon name="heroicons:trash" class="h-4 w-4" />
        </button>
        <button type="button" class="primary-button" :disabled="saving || loading" @click="save">
          <Icon v-if="saving" name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
          <Icon v-else name="heroicons:check-20-solid" class="h-5 w-5" />
          Сохранить
        </button>
      </div>
    </header>

    <div v-if="loading" class="state">
      <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
      Загружаем настройки...
    </div>
    <div v-else-if="errorMessage" class="state state-error">{{ errorMessage }}</div>

    <div v-else class="settings-layout">
      <div class="settings-stack">
        <section class="panel">
          <div class="panel-head">
            <h2>Информационный блок</h2>
            <label class="switch-row switch-row-inline"><span>Показывать блок</span><input type="checkbox" v-model="draft.hasInformationBlock" /></label>
          </div>
          <p class="hint">Перетащите строку, чтобы изменить порядок вывода на чеке.</p>
          <div class="block-list">
            <div
              v-for="block in infoBlocks"
              :key="block.key"
              class="block-row"
              draggable="true"
              @dragstart="onDragStart(block.key)"
              @dragover.prevent
              @drop="onDrop(block.key, infoBlocks)"
            >
              <Icon name="heroicons:bars-2" class="h-4 w-4 drag-handle" />
              <span class="block-name">{{ block.name }}</span>
              <input type="checkbox" v-model="block.isActive" />
            </div>
          </div>
        </section>

        <section class="panel">
          <h2>Баланс клиента</h2>
          <p class="hint">Строки для программы лояльности — показываются в чеке, только если у продажи есть клиент.</p>
          <div class="block-list">
            <div
              v-for="block in balanceBlocks"
              :key="block.key"
              class="block-row"
              draggable="true"
              @dragstart="onDragStart(block.key)"
              @dragover.prevent
              @drop="onDrop(block.key, balanceBlocks)"
            >
              <Icon name="heroicons:bars-2" class="h-4 w-4 drag-handle" />
              <span class="block-name">{{ block.name }}</span>
              <input type="checkbox" v-model="block.isActive" />
            </div>
          </div>
        </section>

        <section class="panel">
          <h2>Долг клиента</h2>
          <div class="block-list">
            <div
              v-for="block in debtBlocks"
              :key="block.key"
              class="block-row"
              draggable="true"
              @dragstart="onDragStart(block.key)"
              @dragover.prevent
              @drop="onDrop(block.key, debtBlocks)"
            >
              <Icon name="heroicons:bars-2" class="h-4 w-4 drag-handle" />
              <span class="block-name">{{ block.name }}</span>
              <input type="checkbox" v-model="block.isActive" />
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Нижний блок</h2>
            <label class="switch-row switch-row-inline"><span>Показывать блок</span><input type="checkbox" v-model="draft.hasLowerBlock" /></label>
          </div>
          <div class="block-list">
            <div
              v-for="block in lowerBlocks"
              :key="block.key"
              class="block-row"
              draggable="true"
              @dragstart="onDragStart(block.key)"
              @dragover.prevent
              @drop="onDrop(block.key, lowerBlocks)"
            >
              <Icon name="heroicons:bars-2" class="h-4 w-4 drag-handle" />
              <span class="block-name">{{ block.name }}</span>
              <input type="checkbox" v-model="block.isActive" />
            </div>
          </div>
          <div class="form-grid mt-4">
            <label class="field field-wide" v-if="isFooterMessageActive">
              <span>Текст благодарности (жирным)</span>
              <input v-model="draft.footerMessage" class="inp" placeholder="Спасибо за покупку!" />
            </label>
            <label class="field field-wide" v-if="isFooterNoteActive">
              <span>Примечание</span>
              <input v-model="draft.footerNote" class="inp" placeholder="Chekni yo'qotmang!" />
            </label>
            <label class="field field-wide" v-if="isQrActive">
              <span>Ссылка для QR (по умолчанию — ссылка на чек)</span>
              <input v-model="draft.qrCodeUrl" class="inp" placeholder="https://..." />
            </label>
          </div>
        </section>

        <section class="panel">
          <h2>Формат и отступы</h2>
          <div class="form-grid">
            <label class="field">
              <span>Ширина бумаги</span>
              <select v-model="paperWidthPreset" class="inp">
                <option value="58">58 мм</option>
                <option value="80">80 мм</option>
                <option value="210">A4 (210 мм)</option>
                <option value="custom">Своя, мм</option>
              </select>
            </label>
            <label v-if="paperWidthPreset === 'custom'" class="field">
              <span>Ширина, мм</span>
              <input type="number" min="20" v-model.number="draft.paperWidth" class="inp" />
            </label>
            <label class="field">
              <span>Разделитель</span>
              <select v-model="draft.dividerStyle" class="inp">
                <option value="none">Без черты</option>
                <option value="single">Одна черта</option>
                <option value="double">Двойная черта</option>
              </select>
            </label>
            <label class="field">
              <span>Размер шрифта, px</span>
              <input type="number" min="8" max="24" v-model.number="draft.fontSize" class="inp" />
            </label>
            <label class="field">
              <span>Отступ между блоками, px</span>
              <input type="number" min="0" max="40" v-model.number="draft.sectionGap" class="inp" />
            </label>
            <label class="field">
              <span>Отступ между чертами (двойной), px</span>
              <input type="number" min="0" max="40" v-model.number="draft.dividerGap" class="inp" />
            </label>
            <label class="switch-row"><span>Разделители между товарами</span><input type="checkbox" v-model="draft.itemDividers" /></label>
          </div>
        </section>

        <section class="panel">
          <button type="button" class="acc-head" @click="showAdvanced = !showAdvanced">
            <Icon name="heroicons:squares-2x2" class="h-5 w-5" />
            <span class="flex-1">Изображения</span>
            <Icon name="heroicons:chevron-down" class="h-4 w-4" :class="{ 'rotate-180': showAdvanced }" />
          </button>
          <div v-show="showAdvanced" class="form-grid mt-4">
            <label class="switch-row"><span>Логотип</span><input type="checkbox" v-model="draft.hasLogo" /></label>
            <label class="field field-wide" v-if="draft.hasLogo">
              <span>Ссылка на логотип</span>
              <input v-model="draft.logoUrl" class="inp" placeholder="https://..." />
            </label>
            <label class="switch-row"><span>Дополнительное изображение</span><input type="checkbox" v-model="draft.hasAdditionalImage" /></label>
            <label class="field field-wide" v-if="draft.hasAdditionalImage">
              <span>Ссылка на изображение</span>
              <input v-model="draft.additionalImageUrl" class="inp" placeholder="https://..." />
            </label>
          </div>
        </section>
      </div>

      <aside class="preview-column">
        <section class="panel preview-panel">
          <h2>Предпросмотр</h2>
          <div class="preview-frame">
            <ReceiptView :receipt="mockReceipt" :settings="draft" mode="screen" />
          </div>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.receipt-settings-page { color: white; }
.back-link { display: inline-flex; align-items: center; gap: 6px; color: #9c9c9c; font-size: 13px; font-weight: 600; margin-bottom: 16px; text-decoration: none; }
.back-link:hover { color: white; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.kicker { color: #79b7ff; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
h1 { margin-top: 8px; font-size: 34px; font-weight: 700; }
.title-input {
  margin-top: 8px; font-size: 34px; font-weight: 700; background: transparent; border: none;
  outline: none; color: white; padding: 0; border-bottom: 2px dashed transparent; max-width: 100%;
}
.title-input:hover, .title-input:focus { border-bottom-color: #404040; }
.subtitle { margin-top: 10px; max-width: 640px; color: #bdbdbd; line-height: 1.6; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.badge-default {
  display: inline-flex; align-items: center; min-height: 46px; padding: 0 14px;
  border-radius: 16px; background: rgba(31,120,255,0.15); color: #79b7ff; font-weight: 700; font-size: 13px;
}
.primary-button, .ghost-button {
  display: inline-flex; align-items: center; gap: 8px; min-height: 46px;
  border-radius: 16px; padding: 0 18px; font-weight: 700;
}
.primary-button { background: #1f78ff; color: white; }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.ghost-button { background: #404040; color: white; }
.ghost-button.danger { padding: 0 14px; background: transparent; color: #f87171; }
.ghost-button.danger:disabled { opacity: 0.3; cursor: not-allowed; }
.state { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 260px; color: #bdbdbd; }
.state-error { color: #fecaca; }

.settings-layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 20px; }
.settings-stack { display: grid; gap: 18px; }
.panel { border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; background: #262626; padding: 22px; }
.panel h2 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.panel-head h2 { margin-bottom: 0; }
.hint { color: #9c9c9c; font-size: 12px; margin-bottom: 12px; }

.block-list { display: grid; gap: 6px; }
.block-row {
  display: flex; align-items: center; gap: 10px;
  min-height: 42px; border-radius: 12px; background: #1f1f1f; padding: 0 12px;
  color: #e8e8e8; font-size: 14px; cursor: grab;
}
.block-row:active { cursor: grabbing; }
.drag-handle { opacity: 0.5; flex-shrink: 0; }
.block-name { flex: 1; }
.block-row input { width: 18px; height: 18px; accent-color: #1f78ff; }

.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.field { display: grid; gap: 6px; }
.field-wide { grid-column: span 2; }
.field span { color: #d7d7d7; font-size: 13px; font-weight: 600; }
.inp {
  min-height: 44px; border: 1px solid #404040; border-radius: 14px;
  background: #1f1f1f; padding: 0 12px; color: white; outline: none;
}
.switch-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 46px; border-radius: 14px; background: #1f1f1f; padding: 0 14px;
  color: #e8e8e8; font-size: 14px; font-weight: 600;
}
.switch-row-inline { min-height: 36px; background: transparent; padding: 0; }
.switch-row input { width: 18px; height: 18px; accent-color: #1f78ff; }
.acc-head {
  display: flex; align-items: center; gap: 8px; width: 100%; font-size: 15px; font-weight: 700;
}
.mt-4 { margin-top: 16px; }

.preview-column { position: sticky; top: 96px; align-self: start; }
.preview-panel { display: flex; flex-direction: column; }
.preview-frame { background: #111; border-radius: 16px; padding: 20px; display: flex; justify-content: center; }

@media (max-width: 1180px) {
  .settings-layout { grid-template-columns: 1fr; }
  .preview-column { position: static; }
}
@media (max-width: 760px) {
  .page-header { flex-direction: column; align-items: stretch; }
  .form-grid { grid-template-columns: 1fr; }
  .field-wide { grid-column: auto; }
}
</style>
