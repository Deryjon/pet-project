<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useHead } from "#imports";
import { useShopAccess } from "@/composables/useShopAccess";
import { useReceipts, type ReceiptData, type ReceiptSettingsData } from "@/composables/useReceipts";
import ReceiptView from "@/components/receipt/ReceiptView.vue";

useHead({ title: "Настройки чека | Konkurent" });

const toast = useToast();
const { currentShopId } = useShopAccess();
const { fetchReceiptSettings, updateReceiptSettings } = useReceipts();

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const showAdvanced = ref(false);

const DEFAULTS: ReceiptSettingsData = {
  shopId: "",
  showClientInfo: true,
  showManagerName: true,
  showManagerPhone: false,
  showCashback: true,
  showDebtLine: true,
  showQrCode: false,
  showItemIndex: true,
  paperWidth: 80,
  fontSize: 13,
  dividerStyle: "single",
  dividerGap: 8,
  sectionGap: 12,
  itemDividers: false,
  footerMessage: "",
  footerNote: "",
  hasLogo: false,
  logoUrl: "",
  hasBarCode: false,
  branchName: "",
  hasBranchName: false,
  address: "",
  hasAddress: false,
  phone: "",
  hasPhone: false,
  workingHours: "",
  hasWorkingHours: false,
  website: "",
  hasWebsite: false,
  taxId: "",
  hasTaxId: false,
  qrCodeUrl: "",
  hasCustomerDebt: false,
  hasCustomerBalance: false,
  elementStyles: null,
};

const draft = reactive<ReceiptSettingsData>({ ...DEFAULTS });
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
    const shopId = currentShopId.value;
    if (!shopId) {
      errorMessage.value = "Магазин не выбран.";
      return;
    }
    const settings = await fetchReceiptSettings(shopId);
    Object.assign(draft, settings, { shopId });
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || "Не удалось загрузить настройки.";
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (saving.value || !currentShopId.value) return;
  saving.value = true;
  try {
    const updated = await updateReceiptSettings(currentShopId.value, draft);
    Object.assign(draft, updated);
    toast.add({ title: "Сохранено", color: "success" });
  } catch (e: any) {
    toast.add({ title: "Ошибка сохранения", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    saving.value = false;
  }
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
  clientName: "Клиент Тестов",
  clientPhone: "+998 91 234 56 78",
  items: [
    { name: "Силиконовый Iphone Чехол", sku: "SKU-001", quantity: 1, price: 65000, total: 65000 },
    { name: "Стекло Samsung S22", sku: "SKU-002", quantity: 2, price: 37500, total: 75000 },
  ],
  subtotal: 140000,
  discount: 5000,
  cashbackEarned: 3500,
  totalDue: 135000,
  paidCash: 135000,
  paidCard: 0,
  paidCashback: 0,
  debt: 0,
  qrPayload: "https://konkurent.example/receipt/TEST-001",
};

load();
</script>

<template>
  <section class="receipt-settings-page">
    <header class="page-header">
      <div>
        <p class="kicker">Настройки</p>
        <h1>Чек</h1>
        <p class="subtitle">Настройте формат, отступы и видимость блоков чека. Изменения применяются сразу в превью и сохраняются только по кнопке «Сохранить».</p>
      </div>
      <button type="button" class="primary-button" :disabled="saving || loading" @click="save">
        <Icon v-if="saving" name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
        <Icon v-else name="heroicons:check-20-solid" class="h-5 w-5" />
        Сохранить
      </button>
    </header>

    <div v-if="loading" class="state">
      <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
      Загружаем настройки...
    </div>
    <div v-else-if="errorMessage" class="state state-error">{{ errorMessage }}</div>

    <div v-else class="settings-layout">
      <div class="settings-stack">
        <section class="panel">
          <h2>Видимость блоков</h2>
          <div class="option-grid">
            <label class="switch-row"><span>Информация о клиенте</span><input type="checkbox" v-model="draft.showClientInfo" /></label>
            <label class="switch-row"><span>Имя продавца</span><input type="checkbox" v-model="draft.showManagerName" /></label>
            <label class="switch-row"><span>Телефон продавца</span><input type="checkbox" v-model="draft.showManagerPhone" /></label>
            <label class="switch-row"><span>Кешбек</span><input type="checkbox" v-model="draft.showCashback" /></label>
            <label class="switch-row"><span>Строка долга</span><input type="checkbox" v-model="draft.showDebtLine" /></label>
            <label class="switch-row"><span>QR-код</span><input type="checkbox" v-model="draft.showQrCode" /></label>
            <label class="switch-row"><span>Нумерация товаров</span><input type="checkbox" v-model="draft.showItemIndex" /></label>
            <label class="switch-row"><span>Штрих-код</span><input type="checkbox" v-model="draft.hasBarCode" /></label>
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
          <h2>Нижний текст</h2>
          <div class="form-grid">
            <label class="field field-wide">
              <span>Сообщение (жирным)</span>
              <input v-model="draft.footerMessage" class="inp" placeholder="Спасибо за покупку!" />
            </label>
            <label class="field field-wide">
              <span>Примечание</span>
              <input v-model="draft.footerNote" class="inp" placeholder="Chekni yo'qotmang!" />
            </label>
          </div>
        </section>

        <section class="panel">
          <button type="button" class="acc-head" @click="showAdvanced = !showAdvanced">
            <Icon name="heroicons:squares-2x2" class="h-5 w-5" />
            <span class="flex-1">Дополнительно (логотип, контакты, QR)</span>
            <Icon name="heroicons:chevron-down" class="h-4 w-4" :class="{ 'rotate-180': showAdvanced }" />
          </button>
          <div v-show="showAdvanced" class="form-grid mt-4">
            <label class="switch-row"><span>Логотип</span><input type="checkbox" v-model="draft.hasLogo" /></label>
            <label class="field field-wide" v-if="draft.hasLogo">
              <span>Ссылка на логотип</span>
              <input v-model="draft.logoUrl" class="inp" placeholder="https://..." />
            </label>

            <label class="switch-row"><span>Название филиала</span><input type="checkbox" v-model="draft.hasBranchName" /></label>
            <input v-if="draft.hasBranchName" v-model="draft.branchName" class="inp" placeholder="Samarqand Darvoza" />

            <label class="switch-row"><span>Адрес</span><input type="checkbox" v-model="draft.hasAddress" /></label>
            <input v-if="draft.hasAddress" v-model="draft.address" class="inp" placeholder="г. Ташкент, ул. Навои 1" />

            <label class="switch-row"><span>Телефон</span><input type="checkbox" v-model="draft.hasPhone" /></label>
            <input v-if="draft.hasPhone" v-model="draft.phone" class="inp" placeholder="+998 90 123 4567" />

            <label class="switch-row"><span>Часы работы</span><input type="checkbox" v-model="draft.hasWorkingHours" /></label>
            <input v-if="draft.hasWorkingHours" v-model="draft.workingHours" class="inp" placeholder="09:00 – 22:00" />

            <label class="switch-row"><span>Сайт</span><input type="checkbox" v-model="draft.hasWebsite" /></label>
            <input v-if="draft.hasWebsite" v-model="draft.website" class="inp" placeholder="https://shop.uz" />

            <label class="switch-row"><span>ИНН / СТИР</span><input type="checkbox" v-model="draft.hasTaxId" /></label>
            <input v-if="draft.hasTaxId" v-model="draft.taxId" class="inp" placeholder="123456789" />

            <label class="field field-wide" v-if="draft.showQrCode">
              <span>Ссылка для QR (по умолчанию — ссылка на чек)</span>
              <input v-model="draft.qrCodeUrl" class="inp" placeholder="https://..." />
            </label>

            <label class="switch-row"><span>Долг клиента</span><input type="checkbox" v-model="draft.hasCustomerDebt" /></label>
            <label class="switch-row"><span>Баланс клиента</span><input type="checkbox" v-model="draft.hasCustomerBalance" /></label>
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
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.kicker { color: #79b7ff; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
h1 { margin-top: 8px; font-size: 34px; font-weight: 700; }
.subtitle { margin-top: 10px; max-width: 640px; color: #bdbdbd; line-height: 1.6; }
.primary-button {
  display: inline-flex; align-items: center; gap: 8px; min-height: 46px;
  border-radius: 16px; padding: 0 18px; font-weight: 700;
  background: #1f78ff; color: white;
}
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.state { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 260px; color: #bdbdbd; }
.state-error { color: #fecaca; }

.settings-layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 20px; }
.settings-stack { display: grid; gap: 18px; }
.panel { border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; background: #262626; padding: 22px; }
.panel h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }

.option-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
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
  .option-grid, .form-grid { grid-template-columns: 1fr; }
  .field-wide { grid-column: auto; }
}
</style>
