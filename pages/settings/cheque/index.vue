<script setup lang="ts">
import { ref, watch } from "vue";
import { useHead, useRouter } from "#imports";
import { useReceipts, type ChequeTemplateSummary } from "@/composables/useReceipts";

useHead({ title: "Шаблоны чеков | Konkurent" });

const router = useRouter();
const toast = useToast();
const { fetchChequeTemplates, createChequeTemplate, updateChequeTemplate, deleteChequeTemplate } = useReceipts();

const loading = ref(true);
const errorMessage = ref("");
const items = ref<ChequeTemplateSummary[]>([]);
const page = ref(1);
const limit = 10;
const total = ref(0);
const nameFilter = ref("");
const busyId = ref<string | null>(null);

const showCreateForm = ref(false);
const newTemplateName = ref("");
const creating = ref(false);

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await fetchChequeTemplates({ name: nameFilter.value, page: page.value, limit });
    items.value = res.items;
    total.value = res.total;
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || "Не удалось загрузить шаблоны.";
  } finally {
    loading.value = false;
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(nameFilter, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    load();
  }, 300);
});

async function createTemplate() {
  if (creating.value) return;
  creating.value = true;
  try {
    const created = await createChequeTemplate(newTemplateName.value.trim() || undefined);
    showCreateForm.value = false;
    newTemplateName.value = "";
    router.push(`/settings/cheque/${created.id}`);
  } catch (e: any) {
    toast.add({ title: "Не удалось создать шаблон", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    creating.value = false;
  }
}

async function makeDefault(item: ChequeTemplateSummary) {
  if (item.isDefault || busyId.value) return;
  busyId.value = item.id;
  try {
    await updateChequeTemplate(item.id, { isDefault: true });
    await load();
  } catch (e: any) {
    toast.add({ title: "Не удалось назначить", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    busyId.value = null;
  }
}

async function removeTemplate(item: ChequeTemplateSummary) {
  if (item.isDefault || busyId.value) return;
  if (!confirm(`Удалить шаблон «${item.name}»?`)) return;
  busyId.value = item.id;
  try {
    await deleteChequeTemplate(item.id);
    await load();
  } catch (e: any) {
    toast.add({ title: "Не удалось удалить", description: e?.data?.message || e?.message, color: "error" });
  } finally {
    busyId.value = null;
  }
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function nextPage() {
  if (page.value * limit >= total.value) return;
  page.value += 1;
  load();
}
function prevPage() {
  if (page.value <= 1) return;
  page.value -= 1;
  load();
}

load();
</script>

<template>
  <section class="cheque-list-page">
    <header class="page-header">
      <div>
        <p class="kicker">Настройки</p>
        <h1>Шаблоны чеков</h1>
        <p class="subtitle">Один шаблон используется для печати по умолчанию. Можно создать любое количество своих шаблонов под разные случаи.</p>
      </div>
      <button type="button" class="primary-button" @click="showCreateForm = !showCreateForm">
        <Icon name="heroicons:plus" class="h-5 w-5" />
        Новый чек
      </button>
    </header>

    <div v-if="showCreateForm" class="create-form">
      <input
        v-model="newTemplateName"
        class="inp"
        placeholder="Название шаблона (например «Акция»)"
        @keyup.enter="createTemplate"
      />
      <button type="button" class="primary-button" :disabled="creating" @click="createTemplate">
        <Icon v-if="creating" name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
        Создать
      </button>
      <button type="button" class="ghost-button" @click="showCreateForm = false">Отмена</button>
    </div>

    <div class="search-row">
      <Icon name="heroicons:magnifying-glass" class="h-4 w-4 search-icon" />
      <input v-model="nameFilter" class="inp search-input" placeholder="Поиск по названию..." />
    </div>

    <div v-if="loading" class="state">
      <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
      Загружаем шаблоны...
    </div>
    <div v-else-if="errorMessage" class="state state-error">{{ errorMessage }}</div>
    <div v-else-if="items.length === 0" class="state">Шаблонов не найдено.</div>

    <div v-else class="template-list">
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="`/settings/cheque/${item.id}`"
        class="template-row"
      >
        <div class="template-main">
          <span class="template-name">{{ item.name }}</span>
          <span v-if="item.isDefault" class="badge-default">По умолчанию</span>
        </div>
        <span class="template-date">{{ formatDate(item.updatedAt) }}</span>
        <div class="template-actions" @click.stop.prevent>
          <button
            v-if="!item.isDefault"
            type="button"
            class="ghost-button small"
            :disabled="busyId === item.id"
            @click="makeDefault(item)"
          >
            Сделать по умолчанию
          </button>
          <button
            v-if="!item.isDefault"
            type="button"
            class="ghost-button small danger"
            :disabled="busyId === item.id"
            @click="removeTemplate(item)"
          >
            <Icon name="heroicons:trash" class="h-4 w-4" />
          </button>
        </div>
      </NuxtLink>
    </div>

    <div v-if="!loading && total > limit" class="pagination">
      <button type="button" class="ghost-button small" :disabled="page <= 1" @click="prevPage">Назад</button>
      <span>Стр. {{ page }} из {{ Math.ceil(total / limit) }}</span>
      <button type="button" class="ghost-button small" :disabled="page * limit >= total" @click="nextPage">Вперёд</button>
    </div>
  </section>
</template>

<style scoped>
.cheque-list-page { color: white; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
.kicker { color: #79b7ff; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
h1 { margin-top: 8px; font-size: 34px; font-weight: 700; }
.subtitle { margin-top: 10px; max-width: 640px; color: #bdbdbd; line-height: 1.6; }

.primary-button, .ghost-button {
  display: inline-flex; align-items: center; gap: 8px; min-height: 46px;
  border-radius: 16px; padding: 0 18px; font-weight: 700; white-space: nowrap;
}
.primary-button { background: #1f78ff; color: white; }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
.ghost-button { background: #404040; color: white; }
.ghost-button.small { min-height: 36px; padding: 0 12px; font-size: 13px; }
.ghost-button.danger { color: #f87171; }
.ghost-button:disabled { opacity: 0.4; cursor: not-allowed; }

.create-form { display: flex; gap: 10px; margin-bottom: 16px; }
.search-row { position: relative; margin-bottom: 16px; max-width: 360px; }
.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); opacity: 0.5; }
.search-input { padding-left: 38px; width: 100%; }

.inp {
  min-height: 46px; border: 1px solid #404040; border-radius: 14px;
  background: #1f1f1f; padding: 0 14px; color: white; outline: none; flex: 1;
}

.state { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 200px; color: #bdbdbd; }
.state-error { color: #fecaca; }

.template-list { display: grid; gap: 10px; }
.template-row {
  display: flex; align-items: center; gap: 16px;
  border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; background: #262626;
  padding: 16px 20px; color: white; text-decoration: none;
}
.template-row:hover { border-color: #1f78ff; }
.template-main { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.template-name { font-weight: 700; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge-default {
  display: inline-flex; align-items: center; min-height: 28px; padding: 0 10px;
  border-radius: 10px; background: rgba(31,120,255,0.15); color: #79b7ff; font-weight: 700; font-size: 12px; flex-shrink: 0;
}
.template-date { color: #9c9c9c; font-size: 13px; flex-shrink: 0; }
.template-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; color: #bdbdbd; font-size: 14px; }

@media (max-width: 760px) {
  .page-header { flex-direction: column; align-items: stretch; }
  .template-row { flex-wrap: wrap; }
  .template-actions { width: 100%; justify-content: flex-end; }
}
</style>
