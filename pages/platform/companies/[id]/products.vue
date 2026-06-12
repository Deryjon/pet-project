<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import CompanyTabs from "@/components/platform/company/CompanyTabs.vue";
import DataPanel from "@/components/platform/DataPanel.vue";
import DataTable from "@/components/platform/DataTable.vue";
import EmptyState from "@/components/platform/EmptyState.vue";
import PageHeader from "@/components/platform/PageHeader.vue";
import { usePlatformAdminApi, type PlatformProduct } from "@/composables/usePlatformAdmin";

definePageMeta({ layout: "platform" });
useHead({ title: "Товары компании | Konkurent" });

const route = useRoute();
const companyId = computed(() => String(route.params.id || "").trim());
const api = usePlatformAdminApi();
const toast = useToast();

const loading = ref(true);
const companyName = ref("");
const products = ref<PlatformProduct[]>([]);
const deletingId = ref("");
const deletingAll = ref(false);

function resolveError(error: any, fallback: string) {
  const message = error?.data?.message ?? error?.response?._data?.message;
  return Array.isArray(message) ? message.join(", ") : message || error?.message || fallback;
}

async function loadData() {
  loading.value = true;
  try {
    const [company, list] = await Promise.all([
      api.getCompany(companyId.value),
      api.getCompanyProducts(companyId.value),
    ]);
    companyName.value = company.name || "";
    products.value = list;
  } catch (error: any) {
    products.value = [];
    toast.add({ title: "Не удалось загрузить товары", description: resolveError(error, "Ошибка загрузки"), color: "error" });
  } finally {
    loading.value = false;
  }
}

async function removeProduct(product: PlatformProduct) {
  if (typeof window !== "undefined" && !window.confirm(`Удалить товар "${product.name}"?`)) {
    return;
  }
  deletingId.value = product.id;
  try {
    await api.deleteCompanyProduct(companyId.value, product.id);
    toast.add({ title: "Товар удалён", description: product.name, color: "success" });
    products.value = products.value.filter((p) => p.id !== product.id);
  } catch (error: any) {
    toast.add({ title: "Не удалось удалить товар", description: resolveError(error, "Ошибка удаления"), color: "error" });
  } finally {
    deletingId.value = "";
  }
}

async function removeAllProducts() {
  if (typeof window !== "undefined" && !window.confirm(`Удалить все ${products.value.length} товаров компании "${companyName.value}"? Это действие необратимо.`)) {
    return;
  }
  deletingAll.value = true;
  try {
    await api.deleteAllCompanyProducts(companyId.value);
    toast.add({ title: "Все товары удалены", description: companyName.value, color: "success" });
    products.value = [];
  } catch (error: any) {
    toast.add({ title: "Не удалось удалить товары", description: resolveError(error, "Ошибка удаления"), color: "error" });
  } finally {
    deletingAll.value = false;
  }
}

watch(companyId, () => {
  if (!companyId.value) return;
  loadData();
}, { immediate: true });
</script>

<template>
  <div class="space-y-8">
    <PageHeader
      eyebrow="Товары"
      :title="companyName ? `Товары: ${companyName}` : 'Товары компании'"
      description="Просмотр и удаление товаров каталога выбранной компании."
    />
    <CompanyTabs :company-id="companyId" />

    <DataPanel title="Каталог товаров" :description="`Всего товаров: ${products.length}`">
      <template #toolbar>
        <UButton
          v-if="products.length > 0"
          color="error"
          variant="soft"
          class="rounded-2xl"
          :loading="deletingAll"
          @click="removeAllProducts"
        >
          <Icon name="heroicons:trash" class="mr-1.5 h-4 w-4" />
          Удалить все товары
        </UButton>
      </template>

      <div v-if="loading" class="space-y-3">
        <div v-for="item in 6" :key="item" class="h-12 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <EmptyState
        v-else-if="!products.length"
        title="Товаров нет"
        description="В каталоге этой компании пока нет товаров."
        icon="heroicons:archive-box"
      />

      <DataTable v-else>
        <thead class="bg-slate-50">
          <tr class="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <th class="px-4 py-3">Название</th>
            <th class="px-4 py-3">Штрихкод</th>
            <th class="px-4 py-3">Категория</th>
            <th class="px-4 py-3">Цена</th>
            <th class="px-4 py-3">Создан</th>
            <th class="px-4 py-3 text-right">Действия</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="product in products" :key="product.id" class="text-[14px] text-slate-700">
            <td class="px-4 py-3 font-semibold text-slate-950">{{ product.name || "—" }}</td>
            <td class="px-4 py-3 font-mono text-[13px] text-slate-500">{{ product.barcode || "—" }}</td>
            <td class="px-4 py-3">{{ product.category || "—" }}</td>
            <td class="px-4 py-3">{{ product.price ? product.price.toLocaleString("ru") : "—" }}</td>
            <td class="px-4 py-3 text-slate-500">{{ product.createdAt || "—" }}</td>
            <td class="px-4 py-3 text-right">
              <UButton
                color="error"
                variant="soft"
                size="sm"
                class="rounded-xl"
                :loading="deletingId === product.id"
                :disabled="deletingAll"
                @click="removeProduct(product)"
              >
                <Icon name="heroicons:trash" class="h-4 w-4" />
              </UButton>
            </td>
          </tr>
        </tbody>
      </DataTable>
    </DataPanel>
  </div>
</template>
