<template>
  <section class="catalog">
    <div class="top flex items-center justify-between gap-4">
      <h2 class="text-[36px] font-bold text-white">Инвентаризация</h2>
      <button type="button" class="create-btn" @click="createOpen = true">
        <Icon name="heroicons:plus-20-solid" class="h-5 w-5" />
        Создать
      </button>
    </div>
    <DataTable class="mt-[40px]" />

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="createOpen" class="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="createOpen = false" />
          <div class="relative w-full max-w-[480px] rounded-[28px] border border-white/10 bg-[#262626] p-7 text-white">
            <h3 class="text-[20px] font-bold">Новая инвентаризация</h3>
            <p class="mt-1 text-[13px] text-[#9a9a9a]">Выберите магазин и укажите название</p>

            <div class="mt-6 space-y-4">
              <div>
                <label class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#9a9a9a]">Магазин</label>
                <select v-model="createForm.shopId" class="w-full appearance-none rounded-[14px] border border-white/10 bg-[#404040] px-4 py-3 text-[14px] font-semibold text-white outline-none focus:border-[#1f78ff]">
                  <option value="">Выберите магазин</option>
                  <option v-for="shop in shopOptions" :key="shop.value" :value="shop.value">{{ shop.label }}</option>
                </select>
              </div>
              <div>
                <label class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#9a9a9a]">Название</label>
                <input v-model="createForm.name" type="text" :placeholder="defaultName" class="w-full rounded-[14px] border border-white/10 bg-[#404040] px-4 py-3 text-[14px] font-semibold text-white outline-none focus:border-[#1f78ff]" />
              </div>
              <div>
                <label class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#9a9a9a]">Комментарий</label>
                <textarea v-model="createForm.comment" rows="2" placeholder="Необязательно" class="w-full rounded-[14px] border border-white/10 bg-[#404040] px-4 py-3 text-[14px] text-white outline-none focus:border-[#1f78ff] resize-none" />
              </div>
            </div>

            <div v-if="createError" class="mt-4 rounded-[12px] bg-[#ff4444]/15 px-4 py-3 text-[13px] text-[#ff7a7a]">{{ createError }}</div>

            <div class="mt-6 flex items-center justify-end gap-3">
              <button type="button" class="rounded-[14px] bg-[#404040] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#505050]" @click="createOpen = false">Отмена</button>
              <button type="button" :disabled="!createForm.shopId || creating" class="rounded-[14px] bg-[#1f78ff] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#4993dd] disabled:cursor-not-allowed disabled:opacity-50" @click="submitCreate">
                {{ creating ? 'Создаём...' : 'Создать' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useHead, useRouter } from "#imports";
import DataTable from "../../components/InventoryDataTable.vue";
import { useApi } from "~/composables/useApi";
import { useUserStore } from "~/store/useUserStore";

useHead({ title: "Инвентаризация | Konkurent" });

const router = useRouter();
const { apiFetch } = useApi();
const userStore = useUserStore();

const createOpen = ref(false);
const creating = ref(false);
const createError = ref("");
const createForm = reactive({ shopId: "", name: "", comment: "" });

const defaultName = `Инвентаризация ${new Date().toLocaleDateString("ru-RU")}`;

const shopOptions = computed(() =>
  (userStore.userState.shops || []).map((shop: any) => ({ value: String(shop.id), label: shop.name })),
);

async function submitCreate() {
  if (!createForm.shopId || creating.value) return;
  creating.value = true;
  createError.value = "";
  try {
    const res: any = await apiFetch("/v1/inventory-sessions", {
      method: "POST",
      body: { shop_id: createForm.shopId, name: createForm.name.trim() || defaultName, comment: createForm.comment.trim() },
    });
    createOpen.value = false;
    createForm.shopId = "";
    createForm.name = "";
    createForm.comment = "";
    if (res?.id) await router.push(`/products/inventory/${encodeURIComponent(res.id)}`);
  } catch (e: any) {
    createError.value = e?.data?.message || e?.message || "Не удалось создать инвентаризацию";
  } finally {
    creating.value = false;
  }
}
</script>

<style scoped>
.create-btn {
  display: inline-flex; align-items: center; gap: 8px;
  min-height: 48px; padding: 0 20px; border: 0; border-radius: 15px;
  background: #1f78ff; color: white; font-size: 15px; font-weight: 700; cursor: pointer;
}
.create-btn:hover { background: #4993dd; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
