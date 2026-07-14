<script setup lang="ts">
import { useHead } from "#imports";
import { usePrintSettingsStore } from "@/store/printSettings";

useHead({ title: "Настройки чеков | Konkurent" });

const printStore = usePrintSettingsStore();
const settings = printStore.settings;

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
          Настройте поведение печати после продажи и параметры ценников. Формат и содержимое самого чека настраиваются на странице «Чек».
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
            <span>Копий чека</span>
            <input v-model.number="settings.receiptCopies" type="number" min="1" max="5" />
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
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <Icon name="heroicons:document-text" class="h-5 w-5" />
          <div>
            <h2>Чек</h2>
            <p>Формат бумаги, отступы, видимость блоков и содержимое чека.</p>
          </div>
        </div>
        <NuxtLink to="/settings/receipt" class="primary-button" style="text-decoration:none;display:inline-flex;">
          <Icon name="heroicons:cog-6-tooth" class="h-5 w-5" />
          Настроить чек
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
.panel-head {
  display: flex;
  align-items: center;
}

.header-actions {
  gap: 10px;
}

.settings-stack {
  display: grid;
  gap: 18px;
  max-width: 720px;
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
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  border-radius: 16px;
  padding: 0 16px;
  font-weight: 700;
}

.primary-button {
  background: #1f78ff;
  color: white;
}

.ghost-button {
  background: #404040;
  color: white;
}

.mt-4 {
  margin-top: 16px;
}

@media (max-width: 760px) {
  .checks-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid,
  .option-grid {
    grid-template-columns: 1fr;
  }
}
</style>
