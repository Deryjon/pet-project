<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useHead, useRoute, useRouter } from "#imports";
import { useCheques, type Cheque } from "@/composables/useCheques";

useHead({ title: "Чеки | Konkurent" });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { getCheques, deleteCheque } = useCheques();

const loading = ref(false);
const deleting = ref(false);
const errorMessage = ref("");
const cheques = ref<Cheque[]>([]);
const total = ref(0);
const searchInput = ref(String(route.query.name ?? ""));
const deleteOpen = ref(false);
const deletingCheque = ref<Cheque | null>(null);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const page = computed({
  get: () => Math.max(1, Number(route.query.page || 1) || 1),
  set: (value: number) => updateQuery({ page: Math.max(1, value) }),
});

const limit = computed({
  get: () => Math.max(1, Number(route.query.limit || 10) || 10),
  set: (value: number) => updateQuery({ limit: Math.max(1, value), page: 1 }),
});

const searchName = computed({
  get: () => String(route.query.name ?? ""),
  set: (value: string) => updateQuery({ name: value, page: 1 }),
});

const sortedCheques = computed(() =>
  [...cheques.value].sort((a, b) => {
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    return String(a.name || "").localeCompare(String(b.name || ""), "ru");
  }),
);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));

const stats = computed(() => ({
  total: total.value,
  defaults: cheques.value.filter((item) => item.is_default).length,
  compact: cheques.value.filter((item) => item.compact).length,
}));

function updateQuery(next: Record<string, number | string>) {
  router.replace({
    query: {
      ...route.query,
      ...next,
    },
  });
}

function chequeWidth(cheque: Cheque) {
  const width = Number(cheque.width || 0);
  if (width > 0) return `${width} мм`;
  return cheque.compact ? "58 мм" : "80 мм";
}

function enabledItemsCount(cheque: Cheque) {
  return (cheque.cheque_items ?? []).filter((item) => item.is_active).length;
}

function openEdit(cheque: Cheque) {
  router.push(`/settings/cheque/${encodeURIComponent(cheque.id)}`);
}

function openCreate() {
  router.push("/settings/cheque/create");
}

function requestDelete(cheque: Cheque) {
  deletingCheque.value = cheque;
  deleteOpen.value = true;
}

async function confirmDelete() {
  if (!deletingCheque.value || deleting.value) return;

  deleting.value = true;
  try {
    await deleteCheque(deletingCheque.value.id);
    toast.add({ title: "Чек удален", color: "success" });
    deleteOpen.value = false;
    deletingCheque.value = null;
    await fetchCheques();
  } catch (error: any) {
    toast.add({
      title: "Не удалось удалить чек",
      description: error?.data?.message || error?.message || "Ошибка удаления",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

async function fetchCheques() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await getCheques({
      name: searchName.value,
      limit: limit.value,
      page: page.value,
    });

    cheques.value = response.cheques;
    total.value = response.count;
  } catch (error: any) {
    cheques.value = [];
    total.value = 0;
    errorMessage.value =
      error?.data?.message || error?.message || "Не удалось загрузить список чеков.";
  } finally {
    loading.value = false;
  }
}

watch(searchInput, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchName.value = value.trim();
  }, 300);
});

watch(
  () => [route.query.name, route.query.limit, route.query.page],
  () => {
    searchInput.value = String(route.query.name ?? "");
    void fetchCheques();
  },
  { immediate: true },
);

watch(totalPages, (pages) => {
  if (page.value > pages) {
    page.value = pages;
  }
});
</script>

<template>
  <section class="cheque-page">
    <header class="page-header">
      <div>
        <p class="kicker">Настройки</p>
        <h1>Чеки</h1>
        <p class="subtitle">
          Список шаблонов чеков загружается из <code>/v1/cheque</code>. Стандартный чек отображается первым.
        </p>
      </div>

      <button type="button" class="primary-button" @click="openCreate">
        <Icon name="heroicons:plus-20-solid" class="h-5 w-5" />
        Создать чек
      </button>
    </header>

    <section class="stats-grid">
      <article class="stat-card">
        <span>Всего чеков</span>
        <strong>{{ stats.total }}</strong>
      </article>
      <article class="stat-card">
        <span>По умолчанию</span>
        <strong>{{ stats.defaults }}</strong>
      </article>
      <article class="stat-card">
        <span>Компактные</span>
        <strong>{{ stats.compact }}</strong>
      </article>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <div>
          <h2>Шаблоны чеков</h2>
          <p>Поиск и пагинация уже работают через query: <code>name</code>, <code>limit</code>, <code>page</code>.</p>
        </div>

        <div class="toolbar-controls">
          <div class="search-box">
            <Icon name="heroicons:magnifying-glass" class="h-5 w-5 text-[#8f8f8f]" />
            <input v-model="searchInput" type="search" placeholder="Поиск по названию" />
          </div>

          <label class="limit-control">
            <span>Показать</span>
            <select v-model.number="limit">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="loading" class="state">
        <Icon name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
        Загружаем чеки...
      </div>

      <div v-else-if="errorMessage" class="state state-error">
        {{ errorMessage }}
      </div>

      <div v-else-if="!sortedCheques.length" class="state">
        Чеки не найдены.
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Тип</th>
              <th>Бумага</th>
              <th>Блоки</th>
              <th>Флаги</th>
              <th class="actions-head">Действие</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cheque in sortedCheques" :key="cheque.id">
              <td>
                <button type="button" class="name-cell" @click="openEdit(cheque)">
                  <span class="name">{{ cheque.name || "Без названия" }}</span>
                  <span class="description">{{ cheque.id }}</span>
                </button>
              </td>
              <td>
                <span :class="['badge', cheque.is_default ? 'badge-standard' : 'badge-custom']">
                  {{ cheque.is_default ? "Стандартный" : "Кастомный" }}
                </span>
              </td>
              <td>{{ chequeWidth(cheque) }}</td>
              <td>{{ enabledItemsCount(cheque) }} / {{ cheque.cheque_items?.length ?? 0 }}</td>
              <td>
                <div class="flag-list">
                  <span v-if="cheque.has_logo">Лого</span>
                  <span v-if="cheque.has_bar_code">Штрихкод</span>
                  <span v-if="cheque.printed_with_billz">Billz</span>
                  <span v-if="cheque.compact">Compact</span>
                  <span v-if="!cheque.has_logo && !cheque.has_bar_code && !cheque.printed_with_billz && !cheque.compact">
                    -
                  </span>
                </div>
              </td>
              <td>
                <div class="actions">
                  <button type="button" class="icon-button" title="Редактировать" @click="openEdit(cheque)">
                    <Icon name="heroicons:pencil-square" class="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    class="icon-button danger"
                    title="Удалить"
                    :disabled="deleting"
                    @click="requestDelete(cheque)"
                  >
                    <Icon name="heroicons:trash" class="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pagination">
        <span>Страница {{ page }} из {{ totalPages }} · {{ total }} всего</span>
        <div class="pagination-actions">
          <button type="button" class="ghost-button" :disabled="page <= 1 || loading" @click="page = page - 1">
            <Icon name="heroicons:chevron-left" class="h-5 w-5" />
            Назад
          </button>
          <button type="button" class="ghost-button" :disabled="page >= totalPages || loading" @click="page = page + 1">
            Вперед
            <Icon name="heroicons:chevron-right" class="h-5 w-5" />
          </button>
        </div>
      </footer>
    </section>

    <UModal
      v-model:open="deleteOpen"
      :ui="{ content: 'mx-4 max-w-[480px] rounded-[28px] border border-white/10 bg-[#262626] p-0 text-white shadow-2xl ring-0 sm:mx-0' }"
    >
      <template #content>
        <div class="modal-body">
          <div class="modal-head">
            <div>
              <h3>Удалить чек</h3>
              <p>
                Удалить шаблон "{{ deletingCheque?.name }}"?
                Если это default-чек, backend назначит default первым оставшимся чеком.
              </p>
            </div>
            <button type="button" class="close-button" :disabled="deleting" @click="deleteOpen = false">
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </button>
          </div>

          <div class="modal-actions">
            <button type="button" class="ghost-button" :disabled="deleting" @click="deleteOpen = false">
              Отмена
            </button>
            <button type="button" class="danger-button" :disabled="deleting" @click="confirmDelete">
              <Icon v-if="deleting" name="heroicons:arrow-path" class="h-5 w-5 animate-spin" />
              Удалить
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>

<style scoped>
.cheque-page {
  color: white;
}

.page-header,
.table-toolbar,
.toolbar-controls,
.search-box,
.pagination,
.pagination-actions,
.actions,
.modal-head,
.modal-actions {
  display: flex;
  align-items: center;
}

.page-header {
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
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
}

.subtitle {
  margin-top: 8px;
  max-width: 760px;
  color: #bdbdbd;
  line-height: 1.6;
}

.subtitle code,
.table-toolbar code {
  color: #9dccff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.stat-card,
.table-panel {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #262626;
}

.stat-card {
  border-radius: 20px;
  padding: 18px;
}

.stat-card span {
  display: block;
  color: #9b9b9b;
  font-size: 13px;
  font-weight: 700;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 30px;
}

.table-panel {
  overflow: hidden;
  border-radius: 24px;
}

.table-toolbar {
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
}

.table-toolbar h2 {
  font-size: 22px;
  font-weight: 700;
}

.table-toolbar p {
  margin-top: 4px;
  color: #9b9b9b;
  font-size: 14px;
}

.toolbar-controls {
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.search-box {
  gap: 10px;
  min-height: 44px;
  min-width: 260px;
  border: 1px solid #404040;
  border-radius: 14px;
  background: #1f1f1f;
  padding: 0 12px;
}

.search-box input {
  width: 100%;
  border: 0;
  background: transparent;
  color: white;
  outline: none;
}

.limit-control {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #bdbdbd;
  font-size: 14px;
  font-weight: 700;
}

.limit-control select,
.field input,
.field select {
  min-height: 44px;
  border: 1px solid #404040;
  border-radius: 14px;
  background: #1f1f1f;
  padding: 0 12px;
  color: white;
  outline: none;
}

.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 260px;
  color: #bdbdbd;
}

.state-error {
  color: #fecaca;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 960px;
  border-collapse: collapse;
}

th,
td {
  padding: 16px 20px;
  text-align: left;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

th {
  color: #9b9b9b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

td {
  color: white;
  font-size: 14px;
}

.actions-head {
  text-align: right;
}

.name-cell {
  display: grid;
  gap: 4px;
  text-align: left;
}

button.name-cell {
  color: inherit;
}

.name {
  color: #8ec3ff;
  font-weight: 800;
}

.description {
  max-width: 420px;
  color: #9b9b9b;
  font-size: 13px;
  line-height: 1.4;
  word-break: break-all;
}

.badge,
.flag-list span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 800;
}

.badge-standard {
  background: rgba(31, 120, 255, 0.16);
  color: #8ec3ff;
}

.badge-custom {
  background: rgba(255, 255, 255, 0.08);
  color: #d8d8d8;
}

.flag-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.flag-list span {
  background: rgba(255, 255, 255, 0.08);
  color: #d8d8d8;
}

.actions {
  justify-content: flex-end;
  gap: 8px;
}

.icon-button,
.close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #404040;
  color: white;
}

.icon-button:hover,
.close-button:hover {
  background: #505050;
}

.icon-button.danger {
  background: rgba(220, 38, 38, 0.18);
  color: #ff9b9b;
}

.pagination {
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: #bdbdbd;
}

.pagination-actions {
  gap: 10px;
}

.primary-button,
.ghost-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  border-radius: 16px;
  padding: 0 16px;
  font-weight: 800;
}

.primary-button {
  background: #1f78ff;
  color: white;
}

.ghost-button {
  background: #404040;
  color: white;
}

.danger-button {
  background: #dc2626;
  color: white;
}

.primary-button:disabled,
.ghost-button:disabled,
.danger-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.modal-body {
  padding: 22px;
}

.modal-head,
.modal-actions {
  display: flex;
  align-items: center;
}

.modal-head {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.modal-head h3 {
  font-size: 22px;
  font-weight: 800;
}

.modal-head p {
  margin-top: 6px;
  color: #bdbdbd;
  line-height: 1.5;
}

.close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #404040;
}

.modal-actions {
  justify-content: flex-end;
  gap: 10px;
}

.modal-body {
  padding: 22px;
}

.modal-head {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.modal-head h3 {
  font-size: 22px;
  font-weight: 800;
}

.modal-head p {
  margin-top: 6px;
  color: #bdbdbd;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field,
.switch-row {
  display: grid;
  gap: 8px;
}

.field-wide {
  grid-column: span 2;
}

.field span,
.switch-row span {
  color: #d7d7d7;
  font-size: 13px;
  font-weight: 700;
}

.switch-row {
  grid-template-columns: 1fr auto;
  align-items: center;
  min-height: 44px;
  border-radius: 14px;
  background: #1f1f1f;
  padding: 0 12px;
}

.switch-row input {
  width: 18px;
  height: 18px;
  accent-color: #1f78ff;
}

.modal-actions {
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

@media (max-width: 900px) {
  .page-header,
  .table-toolbar,
  .pagination,
  .modal-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-controls {
    justify-content: stretch;
  }

  .search-box {
    min-width: 0;
  }
}

@media (max-width: 760px) {
  .stats-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .field-wide {
    grid-column: auto;
  }
}
</style>
