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
                  <input v-model.number="form.width" type="number" min="40" max="120" class="inp" />
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
            <div v-show="openSections.items" class="acc-body space-y-3">
              <div v-if="!groupedItems.length" class="text-[12px] text-[#555] text-center py-2">Нет элементов</div>
              <div v-for="group in groupedItems" :key="group.blockType">
                <p class="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1.5">{{ group.title }}</p>
                <div class="space-y-0.5">
                  <div v-for="item in group.items" :key="item.cheque_option_id" class="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] bg-[#222]">
                    <input type="checkbox" v-model="item.is_active" class="cb flex-none" />
                    <span class="flex-1 text-[12px] truncate" :class="item.is_active ? 'text-[#ccc]' : 'text-[#555]'">{{ itemName(item) }}</span>
                    <div class="flex gap-0.5">
                      <button @click="moveItem(item, -1)" class="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[#555]">
                        <Icon name="heroicons:chevron-up" class="w-3 h-3" />
                      </button>
                      <button @click="moveItem(item, 1)" class="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[#555]">
                        <Icon name="heroicons:chevron-down" class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ── Center: receipt preview ── -->
      <div class="flex-1 overflow-auto bg-[#111] flex items-start justify-center py-12">
        <div class="relative">
          <!-- Torn top -->
          <div :style="{ width: receiptWidthPx + 'px' }" class="overflow-hidden h-3 -mb-px">
            <svg viewBox="0 0 300 12" preserveAspectRatio="none" class="w-full h-full">
              <path d="M0,12 Q7.5,0 15,12 Q22.5,0 30,12 Q37.5,0 45,12 Q52.5,0 60,12 Q67.5,0 75,12 Q82.5,0 90,12 Q97.5,0 105,12 Q112.5,0 120,12 Q127.5,0 135,12 Q142.5,0 150,12 Q157.5,0 165,12 Q172.5,0 180,12 Q187.5,0 195,12 Q202.5,0 210,12 Q217.5,0 225,12 Q232.5,0 240,12 Q247.5,0 255,12 Q262.5,0 270,12 Q277.5,0 285,12 Q292.5,0 300,12" fill="white"/>
            </svg>
          </div>

          <!-- Receipt body -->
          <div
            class="bg-white text-[#111] shadow-2xl"
            :style="{
              width: receiptWidthPx + 'px',
              fontFamily: '\'Courier New\', monospace',
              fontSize: '12px',
              lineHeight: '1.5',
              padding: '16px 14px',
            }"
          >
            <!-- Logo -->
            <div v-if="form.has_logo" class="border border-dashed border-gray-300 h-12 flex items-center justify-center mb-3 text-gray-400 text-xs rounded">
              ЛОГОТИП
            </div>

            <!-- Shop header -->
            <div class="text-center font-bold text-[13px] mb-0.5">{{ form.name || 'Название магазина' }}</div>
            <div v-if="extra.hasBranchName && extra.branchName" class="text-center text-[11px] text-gray-500">{{ extra.branchName }}</div>
            <div v-if="extra.hasAddress && extra.address" class="text-center text-[11px] text-gray-500">{{ extra.address }}</div>
            <div v-if="extra.hasPhone && extra.phone" class="text-center text-[11px] text-gray-500">{{ extra.phone }}</div>
            <div v-if="extra.hasWorkingHours && extra.workingHours" class="text-center text-[11px] text-gray-500">{{ extra.workingHours }}</div>
            <div v-if="extra.hasWebsite && extra.website" class="text-center text-[11px] text-gray-500">{{ extra.website }}</div>

            <div class="rec-hr" />

            <!-- Receipt meta -->
            <div class="flex justify-between text-[11px] text-gray-600">
              <span>Чек #TEST-001</span>
              <span>{{ nowStr }}</span>
            </div>
            <div v-if="extra.hasTaxId && extra.taxId" class="text-[11px] text-gray-500">ИНН: {{ extra.taxId }}</div>
            <div class="text-[11px] text-gray-600">Кассир: Иванов И.</div>

            <div class="rec-hr" />

            <!-- Products -->
            <div v-for="line in previewLines" :key="line.name" class="mb-1.5">
              <div class="font-semibold text-[12px]">{{ line.name }}</div>
              <div class="flex justify-between text-[11px] text-gray-600">
                <span>{{ line.quantity }} шт × {{ fmtMoney(line.price) }}</span>
                <span class="font-bold text-[#111]">{{ fmtMoney(line.total) }}</span>
              </div>
            </div>

            <div class="rec-hr" />

            <!-- Totals -->
            <div class="flex justify-between text-[12px] font-bold mb-0.5">
              <span>ИТОГО</span><span>{{ fmtMoney(previewTotal) }}</span>
            </div>
            <div class="flex justify-between text-[11px] text-gray-500">
              <span>НДС 12%</span><span>{{ fmtMoney(Math.round(previewTotal * 0.107)) }}</span>
            </div>
            <div class="flex justify-between text-[11px] mt-0.5">
              <span>Наличные</span><span>{{ fmtMoney(previewTotal) }}</span>
            </div>
            <div class="flex justify-between text-[11px]">
              <span>Сдача</span><span>0 UZS</span>
            </div>

            <!-- Debt / balance -->
            <template v-if="form.has_customer_debt || form.has_customer_balance">
              <div class="rec-hr" />
              <div v-if="form.has_customer_debt" class="flex justify-between text-[11px] text-gray-600"><span>Долг клиента</span><span>0 UZS</span></div>
              <div v-if="form.has_customer_balance" class="flex justify-between text-[11px] text-gray-600"><span>Баланс клиента</span><span>0 UZS</span></div>
            </template>

            <!-- Footer text -->
            <template v-if="form.has_lower_block && form.display_text">
              <div class="rec-hr" />
              <div class="text-center text-[11px] text-gray-500 whitespace-pre-wrap">{{ form.display_text }}</div>
            </template>

            <!-- Barcode -->
            <template v-if="form.has_bar_code">
              <div class="rec-hr" />
              <div class="text-center tracking-widest font-black text-[18px] text-[#111] leading-none">||| ||| |||| |||||</div>
              <div class="text-center text-[10px] text-gray-500 mt-0.5">1234567890123</div>
            </template>

            <!-- QR code -->
            <template v-if="extra.hasQrCode">
              <div class="rec-hr" />
              <div class="flex flex-col items-center gap-1">
                <div class="w-18 h-18 border border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-[10px] rounded">QR</div>
                <div v-if="extra.qrCodeUrl" class="text-[10px] text-gray-400 text-center break-all max-w-full">{{ extra.qrCodeUrl }}</div>
              </div>
            </template>
          </div>

          <!-- Torn bottom -->
          <div :style="{ width: receiptWidthPx + 'px' }" class="overflow-hidden h-3 -mt-px">
            <svg viewBox="0 0 300 12" preserveAspectRatio="none" class="w-full h-full">
              <path d="M0,0 Q7.5,12 15,0 Q22.5,12 30,0 Q37.5,12 45,0 Q52.5,12 60,0 Q67.5,12 75,0 Q82.5,12 90,0 Q97.5,12 105,0 Q112.5,12 120,0 Q127.5,12 135,0 Q142.5,12 150,0 Q157.5,12 165,0 Q172.5,12 180,0 Q187.5,12 195,0 Q202.5,12 210,0 Q217.5,12 225,0 Q232.5,12 240,0 Q247.5,12 255,0 Q262.5,12 270,0 Q277.5,12 285,0 Q292.5,12 300,0" fill="white"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
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
});

const openSections = reactive({
  basic: true, contacts: false, blocks: true,
  qr: false, footer: false, items: false,
});

function toggleSection(key: keyof typeof openSections) {
  openSections[key] = !openSections[key];
}

const chequeId = computed(() => String(route.params.id || ""));

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

function moveItem(item: ChequeItem, dir: -1 | 1) {
  const items = form.value?.cheque_items ?? [];
  const block = items
    .filter((e) => e.cheque_option?.block_type === item.cheque_option?.block_type)
    .sort((a, b) => Number(a.sequence_number ?? 0) - Number(b.sequence_number ?? 0));
  const i = block.indexOf(item);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= block.length) return;
  const tmp = block[i]!.sequence_number ?? i;
  block[i]!.sequence_number = block[j]!.sequence_number ?? j;
  block[j]!.sequence_number = tmp;
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
    extra_settings: { ...extra },
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
  const rows = previewLines.map((l) =>
    `<tr><td><b>${escHtml(l.name)}</b><br/><small>${l.quantity} × ${fmtMoney(l.price)}</small></td><td style="text-align:right">${fmtMoney(l.total)}</td></tr>`
  ).join("");
  const contacts = [
    extra.hasBranchName && extra.branchName,
    extra.hasAddress && extra.address,
    extra.hasPhone && extra.phone,
    extra.hasWorkingHours && extra.workingHours,
    extra.hasWebsite && extra.website,
  ].filter(Boolean).map((t) => `<div>${escHtml(t)}</div>`).join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Чек</title>
<style>*{box-sizing:border-box}body{margin:0;background:white;color:#111;font-family:'Courier New',monospace;font-size:12px}
.r{width:${wMm};padding:14px}.c{text-align:center}.sm{color:#666;font-size:11px}.hr{border-top:1px dashed #999;margin:8px 0}
table{width:100%;border-collapse:collapse}td{padding:2px 0;vertical-align:top}td:last-child{text-align:right;white-space:nowrap}
@page{margin:0;size:${wMm} auto}</style></head><body><div class="r">
${form.value.has_logo ? `<div class="c" style="border:1px dashed #ccc;padding:8px;color:#bbb;margin-bottom:8px">LOGO</div>` : ""}
<div class="c"><b>${escHtml(form.value.name)}</b></div>
${contacts ? `<div class="c sm">${contacts}</div>` : ""}
<div class="hr"/>
<div>Чек #TEST-001 &nbsp;&nbsp; ${escHtml(nowStr)}</div>
${extra.hasTaxId && extra.taxId ? `<div class="sm">ИНН: ${escHtml(extra.taxId)}</div>` : ""}
<div class="hr"/>
<table>${rows}</table>
<div class="hr"/>
<div style="display:flex;justify-content:space-between"><b>ИТОГО</b><b>${fmtMoney(previewTotal)}</b></div>
<div style="display:flex;justify-content:space-between" class="sm"><span>Наличные</span><span>${fmtMoney(previewTotal)}</span></div>
${form.value.has_customer_debt ? `<div style="display:flex;justify-content:space-between" class="sm"><span>Долг</span><span>0 UZS</span></div>` : ""}
${form.value.has_lower_block && form.value.display_text ? `<div class="hr"/><div class="c sm">${escHtml(form.value.display_text)}</div>` : ""}
${form.value.has_bar_code ? `<div class="hr"/><div class="c" style="letter-spacing:4px;font-size:18px;font-weight:900">||| |||| |||||</div><div class="c sm">1234567890123</div>` : ""}
${extra.hasQrCode ? `<div class="hr"/><div class="c"><div style="width:60px;height:60px;border:1px dashed #ccc;display:inline-flex;align-items:center;justify-content:center;color:#ccc;font-size:10px">QR</div>${extra.qrCodeUrl ? `<div class="sm">${escHtml(extra.qrCodeUrl)}</div>` : ""}</div>` : ""}
</div></body></html>`;

  const win = window.open("", "_blank", "width=460,height=800");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
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
.field { display: grid; gap: 5px; }
.label { font-size: 11px; font-weight: 500; color: #555; }
.toggle-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; }
.toggle-field { }
.cb { width: 14px; height: 14px; accent-color: #1f78ff; flex-shrink: 0; cursor: pointer; }
.rec-hr { border-top: 1px dashed #bbb; margin: 8px 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
