<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AdminSidebar from "@/components/platform/AdminSidebar.vue";
import AdminTopbar from "@/components/platform/AdminTopbar.vue";
import { usePlatformAdminSession } from "@/composables/usePlatformAdmin";

const router = useRouter();
const { authenticated, restore, signOut } = usePlatformAdminSession();
const mobileSidebarOpen = ref(false);
const checkingAccess = ref(true);

onMounted(async () => {
  const hasAccess = await restore();
  checkingAccess.value = false;

  if (!hasAccess) {
    router.replace("/platform/login");
  }
});

function logout() {
  signOut();
  router.push("/platform/login");
}
</script>

<template>
  <div class="platform-shell min-h-screen text-slate-900">
    <div class="platform-bg"></div>
    <div class="platform-grid"></div>

    <div v-if="checkingAccess" class="relative z-10 flex min-h-screen items-center justify-center px-4">
      <div class="platform-loading-card">
        <div class="platform-loading-icon">
          <Icon name="heroicons:shield-check" class="h-6 w-6" />
        </div>
        <div>
          <p class="platform-loading-title">Проверка доступа</p>
          <p class="platform-loading-text">Подготавливаем рабочее пространство платформы.</p>
        </div>
      </div>
    </div>

    <div v-else-if="authenticated" class="relative z-10 flex min-h-screen">
      <transition name="fade-sidebar">
        <div v-if="mobileSidebarOpen" class="fixed inset-0 z-30 bg-[#06111f]/45 backdrop-blur-sm lg:hidden" @click="mobileSidebarOpen = false" />
      </transition>

      <div class="fixed inset-y-0 left-0 z-40 hidden w-[304px] p-5 lg:block">
        <AdminSidebar @logout="logout" />
      </div>

      <div class="fixed inset-y-0 left-0 z-40 w-[304px] p-4 transition-transform duration-300 lg:hidden" :class="mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'">
        <AdminSidebar mobile @close="mobileSidebarOpen = false" @logout="logout" />
      </div>

      <main class="platform-main relative w-full px-4 py-4 sm:px-6 lg:ml-[304px] lg:px-8 lg:py-6">
        <AdminTopbar @open-sidebar="mobileSidebarOpen = true" @logout="logout" />
        <slot />
      </main>
    </div>
  </div>
</template>

<style>
.platform-shell {
  position: relative;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.14), transparent 28%),
    radial-gradient(circle at top right, rgba(12, 74, 110, 0.16), transparent 24%),
    linear-gradient(180deg, #f4efe6 0%, #edf2f7 44%, #eef4fb 100%);
}

.platform-bg,
.platform-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.platform-bg {
  background:
    radial-gradient(circle at 12% 18%, rgba(245, 158, 11, 0.1), transparent 20%),
    radial-gradient(circle at 82% 16%, rgba(14, 165, 233, 0.09), transparent 24%),
    radial-gradient(circle at 70% 72%, rgba(16, 185, 129, 0.08), transparent 18%);
}

.platform-grid {
  opacity: 0.22;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(180deg, rgba(255, 255, 255, 0.75), transparent 95%);
}

.platform-loading-card {
  display: flex;
  align-items: center;
  gap: 18px;
  width: min(100%, 420px);
  padding: 24px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(16px);
}

.platform-loading-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 20px;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #f8fafc;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.22);
}

.platform-loading-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.platform-loading-text {
  margin-top: 6px;
  font-size: 0.92rem;
  color: #475569;
}

.platform-main table {
  width: 100%;
}

.platform-main table thead th {
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: #64748b;
}

.platform-main table tbody td {
  vertical-align: top;
}

.platform-main input,
.platform-main select,
.platform-main textarea {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.platform-main input:focus,
.platform-main select:focus,
.platform-main textarea:focus {
  border-color: rgba(13, 148, 136, 0.38) !important;
  box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.12);
  background: rgba(255, 255, 255, 0.96) !important;
  outline: none;
}

.platform-main ::selection {
  background: rgba(20, 184, 166, 0.18);
}

.fade-sidebar-enter-active,
.fade-sidebar-leave-active {
  transition: opacity 0.2s ease;
}

.fade-sidebar-enter-from,
.fade-sidebar-leave-to {
  opacity: 0;
}
</style>
