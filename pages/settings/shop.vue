<template>
  <div class="p-6 text-white">
    <h1 class="text-2xl font-bold mb-4">Магазин</h1>

    <div class="bg-[#262626] p-5 rounded-2xl max-w-2xl flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-[#bdbdbd] mb-1">Ключ филиала (id или code)</label>
          <input v-model="key" type="text" class="w-full bg-[#404040] rounded px-3 py-2 outline-none" placeholder="1 или branch_a" />
        </div>
        <div class="flex items-end">
          <button @click="fetchBranch" :disabled="loading" class="bg-[#1f78ff] hover:bg-[#4993dd] disabled:opacity-50 px-4 py-2 rounded font-semibold flex items-center gap-2">
            <Icon v-if="loading" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            Загрузить
          </button>
        </div>
      </div>

      <div v-if="loaded" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-[#bdbdbd] mb-1">ID</label>
          <input :value="loaded.id" class="w-full bg-[#333] rounded px-3 py-2" disabled />
        </div>
        <div>
          <label class="block text-sm text-[#bdbdbd] mb-1">Код</label>
          <input :value="loaded.code" class="w-full bg-[#333] rounded px-3 py-2" disabled />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm text-[#bdbdbd] mb-1">Название (title)</label>
          <input v-model="title" class="w-full bg-[#404040] rounded px-3 py-2 outline-none" placeholder="Введите новое название" />
        </div>
      </div>

      <div class="flex gap-3">
        <button :disabled="!loaded || saving" @click="save" class="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded font-semibold flex items-center gap-2">
          <Icon v-if="saving" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
          Сохранить
        </button>
        <span v-if="ok" class="text-green-400">Сохранено</span>
        <span v-if="err" class="text-red-400">{{ err }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { useUserStore } from '~/store/useUserStore'

const { apiFetch } = useApi()
const user = useUserStore()

const key = ref<string>('')
const loaded = ref<any | null>(null)
const title = ref('')
const saving = ref(false)
const loading = ref(false)
const ok = ref(false)
const err = ref<string | null>(null)

async function fetchBranch() {
  ok.value = false; err.value = null
  if (!key.value) return
  loading.value = true
  try {
    const res: any = await apiFetch(`/branches/${encodeURIComponent(key.value)}`, { method: 'GET' })
    loaded.value = res
    title.value = String(res?.title ?? '')
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Не удалось загрузить филиал'
    loaded.value = null
  } finally { loading.value = false }
}

async function save() {
  if (!loaded.value) return
  saving.value = true; ok.value = false; err.value = null
  const k = loaded.value.code || String(loaded.value.id)
  try {
    const res: any = await apiFetch(`/branches/${encodeURIComponent(k)}`, { method: 'PUT', body: { title: title.value } })
    loaded.value = res
    title.value = String(res?.title ?? title.value)
    ok.value = true
  } catch (e: any) {
    err.value = e?.data?.message || e?.message || 'Не удалось сохранить'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  const preferred = user.user?.branchCode || user.user?.branch_id || user.user?.branchId
  if (preferred) {
    key.value = String(preferred)
    fetchBranch()
  }
})
</script>
