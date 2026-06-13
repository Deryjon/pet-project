<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useHead } from "#imports";
import { useApi } from "~/composables/useApi";

useHead({ title: "Уведомления | Konkurent" });

const { apiFetch } = useApi();
const toast = useToast();

type Subscriber = {
  id: string;
  chatId: string;
  userId: number;
  userName: string;
  notifyOnSale: boolean;
  branchCode: string | null;
  linkedAt: string;
};

const generatingLink = ref(false);
const telegramLink = ref("");
const linkCopied = ref(false);

const loadingSubscribers = ref(false);
const subscribers = ref<Subscriber[]>([]);
const removingId = ref<string | null>(null);

async function generateLink() {
  generatingLink.value = true;
  telegramLink.value = "";
  try {
    const res = await apiFetch<{ link: string }>("/telegram/generate-link", {
      method: "POST",
    });
    telegramLink.value = res?.link ?? "";
  } catch (e: any) {
    toast.add({
      title: "Ошибка",
      description: String(e?.data?.message ?? e?.message ?? "Не удалось сгенерировать ссылку"),
      color: "error",
    });
  } finally {
    generatingLink.value = false;
  }
}

async function copyLink() {
  if (!telegramLink.value) return;
  try {
    await navigator.clipboard.writeText(telegramLink.value);
    linkCopied.value = true;
    setTimeout(() => (linkCopied.value = false), 2000);
  } catch {
    /* ignore */
  }
}

async function loadSubscribers() {
  loadingSubscribers.value = true;
  try {
    const res = await apiFetch<Subscriber[]>("/telegram/subscribers");
    subscribers.value = Array.isArray(res) ? res : [];
  } catch {
    subscribers.value = [];
  } finally {
    loadingSubscribers.value = false;
  }
}

async function removeSubscriber(id: string) {
  removingId.value = id;
  try {
    await apiFetch(`/telegram/subscribers/${id}`, { method: "DELETE" });
    subscribers.value = subscribers.value.filter((s) => s.id !== id);
    toast.add({ title: "Подписчик отключён", color: "success" });
  } catch (e: any) {
    toast.add({
      title: "Ошибка",
      description: String(e?.data?.message ?? e?.message ?? ""),
      color: "error",
    });
  } finally {
    removingId.value = null;
  }
}

async function toggleNotify(sub: Subscriber) {
  try {
    await apiFetch(`/telegram/subscribers/${sub.id}`, {
      method: "PATCH",
      body: { notifyOnSale: !sub.notifyOnSale },
    });
    sub.notifyOnSale = !sub.notifyOnSale;
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  loadSubscribers();
});
</script>

<template>
  <section class="mx-auto max-w-[760px] py-10 px-4">
    <h1 class="text-[30px] font-bold text-white mb-8">Уведомления</h1>

    <!-- Telegram block -->
    <div class="rounded-[24px] bg-[#2b2b2b] p-7 mb-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#229ED9]/20">
          <Icon name="logos:telegram" class="h-6 w-6" />
        </div>
        <div>
          <h2 class="text-[20px] font-bold text-white">Telegram-уведомления</h2>
          <p class="text-[14px] text-[#9ca3af]">Получайте оповещения о продажах прямо в Telegram</p>
        </div>
      </div>

      <div class="rounded-[16px] bg-[#1f1f1f] p-5 mb-5 space-y-2 text-[14px] text-[#d1d5db]">
        <p>📲 Нажмите <b class="text-white">«Получить ссылку»</b> — появится персональная ссылка на бота.</p>
        <p>🔗 Перейдите по ней и нажмите <b class="text-white">«Старт»</b> в Telegram.</p>
        <p>✅ Готово — при каждой продаже вы будете получать уведомление.</p>
        <p class="text-[#fbbf24]">⚠️ Ссылка действует 15 минут. Если истекла — сгенерируйте новую.</p>
      </div>

      <UButton
        color="primary"
        variant="solid"
        :loading="generatingLink"
        class="rounded-[16px] px-6 py-3 text-[15px] font-semibold bg-[#229ED9] hover:bg-[#1a85bc]"
        @click="generateLink"
      >
        <Icon name="logos:telegram" class="h-4 w-4 mr-2" />
        Получить ссылку для подключения
      </UButton>

      <!-- Link result -->
      <transition name="fade">
        <div v-if="telegramLink" class="mt-5 rounded-[16px] bg-[#1a3a4a] border border-[#229ED9]/40 p-4">
          <p class="text-[13px] text-[#9ca3af] mb-2">Ваша персональная ссылка (действует 15 мин):</p>
          <div class="flex items-center gap-2">
            <a
              :href="telegramLink"
              target="_blank"
              class="flex-1 truncate text-[#60c8f5] text-[15px] font-medium hover:underline"
            >
              {{ telegramLink }}
            </a>
            <button
              class="flex items-center gap-1.5 rounded-[10px] bg-[#404040] px-3 py-1.5 text-[13px] text-white hover:bg-[#505050] transition-colors"
              @click="copyLink"
            >
              <Icon :name="linkCopied ? 'heroicons:check' : 'heroicons:clipboard'" class="h-4 w-4" />
              {{ linkCopied ? "Скопировано" : "Копировать" }}
            </button>
          </div>
          <a
            :href="telegramLink"
            target="_blank"
            class="mt-3 inline-flex items-center gap-2 rounded-[12px] bg-[#229ED9] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#1a85bc] transition-colors"
          >
            <Icon name="logos:telegram" class="h-4 w-4" />
            Открыть в Telegram
          </a>
        </div>
      </transition>
    </div>

    <!-- Subscribers list -->
    <div class="rounded-[24px] bg-[#2b2b2b] p-7">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-[18px] font-bold text-white">Подключённые сотрудники</h2>
        <button
          class="text-[13px] text-[#9ca3af] hover:text-white transition-colors"
          @click="loadSubscribers"
        >
          <Icon name="heroicons:arrow-path" class="h-4 w-4" :class="{ 'animate-spin': loadingSubscribers }" />
        </button>
      </div>

      <div v-if="loadingSubscribers" class="flex justify-center py-8">
        <Icon name="heroicons:arrow-path" class="h-6 w-6 text-[#9ca3af] animate-spin" />
      </div>

      <div v-else-if="!subscribers.length" class="py-8 text-center text-[#9ca3af] text-[15px]">
        Нет подключённых сотрудников
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="sub in subscribers"
          :key="sub.id"
          class="flex items-center justify-between gap-3 rounded-[16px] bg-[#404040] px-5 py-4"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#229ED9]/20">
              <Icon name="logos:telegram" class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="text-[15px] font-semibold text-white truncate">{{ sub.userName || "Сотрудник" }}</p>
              <p class="text-[13px] text-[#9ca3af]">
                {{ sub.branchCode ? `Филиал: ${sub.branchCode}` : "Все филиалы" }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              :title="sub.notifyOnSale ? 'Уведомления включены' : 'Уведомления выключены'"
              class="flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors"
              :class="sub.notifyOnSale ? 'bg-green-500/20 text-green-400' : 'bg-[#2f2f2f] text-[#9ca3af]'"
              @click="toggleNotify(sub)"
            >
              <Icon name="heroicons:bell" class="h-4 w-4" />
            </button>
            <button
              :disabled="removingId === sub.id"
              class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              @click="removeSubscriber(sub.id)"
            >
              <Icon
                :name="removingId === sub.id ? 'heroicons:arrow-path' : 'heroicons:x-mark'"
                class="h-4 w-4"
                :class="{ 'animate-spin': removingId === sub.id }"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
