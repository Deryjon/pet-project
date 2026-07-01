<script setup lang="ts">
import { useHead } from "#imports";
import { usePrintSettingsStore } from "@/store/printSettings";
import { useReceiptPrinter } from "@/composables/useReceiptPrinter";

useHead({ title: "Настройки чеков | Konkurent" });

const printStore = usePrintSettingsStore();
const settings = printStore.settings;
const receiptPrinter = useReceiptPrinter();

async function testPrint() {
  await receiptPrinter.printReceipt({
    number: "TEST-001",
    date: new Date().toLocaleString("ru-RU"),
    seller: "",
    cashier: "",
    client: "—",
    shop: settings.companyName || "",
    items: [
      { name: "Чехол iPhone 12", quantity: 1, price: "50 000 UZS" },
      { name: "Стекло Samsung S22", quantity: 2, price: "80 000 UZS" },
    ],
    total: "210 000 UZS",
    payment: "Наличные",
  });
}

function save() {
  printStore.saveSettings();
}
</script>

<template>
  <section class="checks-page">
    <header class="checks-header">
      <div>
        <p class="kicker">Настройки</p>
        <h1>Чеки и печать</h1>
        <p class="subtitle">
          Настройте чек после продажи, шаблон печати и базовые параметры для будущей печати ценников.
        </p>
      </div>

      <div class="header-actions">
        <button type="button" class="ghost-button" @click="printStore.resetSettings">
          <Icon name="heroicons:arrow-path" class="h-5 w-5" />
          Сбросить
        </button>
        <button type="button" class="primary-button" @click="save">
          <Icon name="heroicons:check-20-solid" class="h-5 w-5" />
          Сохранить
        </button>
      </div>
    </header>

    <div class="checks-layout">
      <div class="settings-stack">
        <section class="panel">
          <div class="panel-head">
            <Icon name="heroicons:receipt-percent" class="h-5 w-5" />
            <div>
              <h2>Чек после продажи</h2>
              <p>Эти параметры используются после успешной оплаты в кассе.</p>
            </div>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>Название компании</span>
              <input v-model="settings.companyName" type="text" />
            </label>
            <label class="field">
              <span>Название магазина</span>
              <input v-model="settings.shopName" type="text" placeholder="Например, Globus Mall" />
            </label>
            <label class="field field-wide">
              <span>Адрес</span>
              <input v-model="settings.address" type="text" placeholder="Адрес магазина" />
            </label>
            <label class="field">
              <span>Телефон</span>
              <input v-model="settings.phone" type="text" placeholder="+998 ..." />
            </label>
            <label class="field">
              <span>Принтер чеков</span>
              <input v-model="settings.receiptPrinterName" type="text" placeholder="Имя принтера" />
            </label>
          </div>

          <div class="option-grid">
            <label class="switch-row">
              <span>Открывать чек после продажи</span>
              <input v-model="settings.autoOpenReceiptAfterSale" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Сразу отправлять на печать</span>
              <input v-model="settings.autoPrintReceiptAfterSale" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Показывать способ оплаты</span>
              <input v-model="settings.showPaymentMethod" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Показывать подвал</span>
              <input v-model="settings.showFooter" type="checkbox" />
            </label>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <Icon name="heroicons:cog-6-tooth" class="h-5 w-5" />
            <div>
              <h2>Шаблон чека</h2>
              <p>Формат бумаги, количество копий и текст внизу чека.</p>
            </div>
          </div>

          <div class="segmented">
            <button
              type="button"
              :class="{ active: settings.paperWidth === '58' }"
              @click="settings.paperWidth = '58'"
            >
              58 мм
            </button>
            <button
              type="button"
              :class="{ active: settings.paperWidth === '80' }"
              @click="settings.paperWidth = '80'"
            >
              80 мм
            </button>
          </div>

          <div class="form-grid mt-4">
            <label class="field">
              <span>Копий чека</span>
              <input v-model.number="settings.receiptCopies" type="number" min="1" max="5" />
            </label>
            <label class="field field-wide">
              <span>Текст подвала</span>
              <input v-model="settings.footerText" type="text" />
            </label>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <Icon name="heroicons:document-text" class="h-5 w-5" />
            <div>
              <h2>Шаблоны чеков</h2>
              <p>Управляйте шаблонами чеков, порядком блоков и содержимым.</p>
            </div>
          </div>
          <NuxtLink to="/settings/cheque" class="primary-button" style="text-decoration:none;display:inline-flex;">
            <Icon name="heroicons:cog-6-tooth" class="h-5 w-5" />
            Управление шаблонами
          </NuxtLink>
        </section>

        <section class="panel">
          <div class="panel-head">
            <Icon name="heroicons:tag" class="h-5 w-5" />
            <div>
              <h2>Ценники</h2>
              <p>Базовые настройки для следующего шага печати ценников.</p>
            </div>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>Принтер ценников</span>
              <input v-model="settings.priceTagPrinterName" type="text" placeholder="Имя принтера" />
            </label>
            <label class="field">
              <span>Копий по умолчанию</span>
              <input v-model.number="settings.priceTagCopies" type="number" min="1" max="100" />
            </label>
          </div>

          <div class="segmented mt-4">
            <button
              type="button"
              :class="{ active: settings.priceTagSize === 'small' }"
              @click="settings.priceTagSize = 'small'"
            >
              Малый
            </button>
            <button
              type="button"
              :class="{ active: settings.priceTagSize === 'medium' }"
              @click="settings.priceTagSize = 'medium'"
            >
              Средний
            </button>
            <button
              type="button"
              :class="{ active: settings.priceTagSize === 'a4' }"
              @click="settings.priceTagSize = 'a4'"
            >
              A4
            </button>
          </div>

          <div class="option-grid mt-4">
            <label class="switch-row">
              <span>Показывать штрихкод</span>
              <input v-model="settings.showBarcodeOnPriceTag" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>Показывать артикул</span>
              <input v-model="settings.showSkuOnPriceTag" type="checkbox" />
            </label>
          </div>
        </section>
      </div>

      <aside class="preview-column">
        <section class="panel preview-panel">
          <div class="panel-head">
            <Icon name="heroicons:eye" class="h-5 w-5" />
            <div>
              <h2>Предпросмотр</h2>
              <p>Так будет выглядеть обычный чек продажи.</p>
            </div>
          </div>

          <div class="receipt-preview" :class="printStore.receiptPaperClass">
            <div v-if="settings.showCompanyName" style="text-align:center;font-weight:900;font-size:14px;">{{ settings.companyName }}</div>
            <div v-if="settings.showShopName && (settings.shopName || settings.address)" style="text-align:center;font-size:12px;">{{ settings.shopName || settings.address }}</div>
            <div v-if="settings.phone" style="text-align:center;font-size:12px;">{{ settings.phone }}</div>
            <div style="border-top:1px dashed #000;margin:6px 0;"></div>
            <div style="font-weight:900;font-size:13px;">Чек #: TEST-001</div>
            <div style="font-size:12px;">{{ new Date().toLocaleString("ru-RU") }}</div>
            <div v-if="settings.showPaymentMethod" style="font-size:12px;">Оплата: Наличные</div>
            <div style="border-top:1px dashed #000;margin:6px 0;"></div>
            <div style="margin-bottom:6px;">
              <div style="font-weight:900;font-size:13px;">1. Чехол iPhone 12</div>
              <div style="font-size:12px;display:flex;justify-content:space-between;"><span>1 x 50 000 UZS</span><span style="font-weight:900;">50 000 UZS</span></div>
            </div>
            <div style="margin-bottom:6px;">
              <div style="font-weight:900;font-size:13px;">2. Стекло Samsung S22</div>
              <div style="font-size:12px;display:flex;justify-content:space-between;"><span>2 x 80 000 UZS</span><span style="font-weight:900;">160 000 UZS</span></div>
            </div>
            <div style="border-top:1px dashed #000;margin:6px 0;"></div>
            <div style="font-weight:900;font-size:16px;display:flex;justify-content:space-between;"><span>ИТОГО</span><span>210 000 UZS</span></div>
            <template v-if="settings.showFooter && settings.footerText">
              <div style="border-top:1px dashed #000;margin:6px 0;"></div>
              <div style="text-align:center;font-size:12px;">{{ settings.footerText }}</div>
            </template>
          </div>

          <button type="button" class="test-button" @click="testPrint">
            <Icon name="heroicons:printer" class="h-5 w-5" />
            Тестовая печать
          </button>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.checks-page {
  color: white;
}

.checks-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.kicker {
  color: #79b7ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  margin-top: 8px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.05;
}

.subtitle {
  margin-top: 10px;
  max-width: 720px;
  color: #bdbdbd;
  line-height: 1.6;
}

.header-actions,
.panel-head,
.receipt-line,
.total-row {
  display: flex;
  align-items: center;
}

.header-actions {
  gap: 10px;
}

.checks-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
}

.settings-stack {
  display: grid;
  gap: 18px;
}

.panel {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  background: #262626;
  padding: 22px;
}

.panel-head {
  gap: 12px;
  margin-bottom: 18px;
}

.panel-head > .iconify {
  color: #79b7ff;
}

.panel-head h2 {
  font-size: 20px;
  font-weight: 700;
}

.panel-head p {
  margin-top: 4px;
  color: #9b9b9b;
  font-size: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field-wide {
  grid-column: span 2;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #d7d7d7;
  font-size: 13px;
  font-weight: 600;
}

.field input {
  min-height: 46px;
  border: 1px solid #404040;
  border-radius: 14px;
  background: #1f1f1f;
  padding: 0 14px;
  color: white;
  outline: none;
}

.field input:focus {
  border-color: #1f78ff;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  border-radius: 14px;
  background: #1f1f1f;
  padding: 12px 14px;
  color: #e8e8e8;
  font-size: 14px;
  font-weight: 600;
}

.switch-row input {
  width: 18px;
  height: 18px;
  accent-color: #1f78ff;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.segmented button {
  min-height: 42px;
  border-radius: 14px;
  background: #1f1f1f;
  color: #bdbdbd;
  font-weight: 700;
}

.segmented button.active {
  background: #1f78ff;
  color: white;
}

.primary-button,
.ghost-button,
.test-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  border-radius: 16px;
  padding: 0 16px;
  font-weight: 700;
}

.primary-button,
.test-button {
  background: #1f78ff;
  color: white;
}

.ghost-button {
  background: #404040;
  color: white;
}

.preview-column {
  position: sticky;
  top: 96px;
  align-self: start;
}

.receipt-preview {
  margin: 0 auto;
  border-radius: 8px;
  background: white;
  color: #000;
  padding: 12px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
}

.receipt-paper-58 {
  max-width: 250px;
}

.receipt-paper-80 {
  max-width: 320px;
}

.test-button {
  width: 100%;
  margin-top: 16px;
}

.mt-4 {
  margin-top: 16px;
}

@media (max-width: 1180px) {
  .checks-layout {
    grid-template-columns: 1fr;
  }

  .preview-column {
    position: static;
  }
}

@media (max-width: 760px) {
  .checks-header,
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid,
  .option-grid {
    grid-template-columns: 1fr;
  }

  .field-wide {
    grid-column: auto;
  }
}
</style>
