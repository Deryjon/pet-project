<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useLocationStore } from "./store/useLocationStore"; // РїСѓС‚СЊ РїРѕРїСЂР°РІСЊ РµСЃР»Рё РЅСѓР¶РЅРѕ

const locationStore = useLocationStore();
const router = useRouter();
const { isPageLoading, startRouteLoading, stopRouteLoading } = usePageLoader();
const showGlobalLoader = computed(() => isPageLoading.value);

let removeBeforeEach: (() => void) | null = null;
let removeAfterEach: (() => void) | null = null;
let removeOnError: (() => void) | null = null;

onMounted(() => {
  locationStore.init();
  removeBeforeEach = router.beforeEach((to, from) => {
    if (to.fullPath !== from.fullPath) {
      startRouteLoading();
    }
  });
  removeAfterEach = router.afterEach(() => {
    stopRouteLoading();
  });
  removeOnError = router.onError(() => {
    stopRouteLoading();
  });
});

onBeforeUnmount(() => {
  removeBeforeEach?.();
  removeAfterEach?.();
  removeOnError?.();
});
</script>

<template>
  <UApp>
    <div>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>

      <Transition name="global-loader-fade">
        <div v-if="showGlobalLoader" class="global-page-loader" role="status" aria-live="polite" aria-label="Загрузка">
          <div class="global-page-loader__card">
            <Icon name="heroicons:arrow-path" class="global-page-loader__icon" />
            <span>Загрузка...</span>
          </div>
        </div>
      </Transition>
    </div>
  </UApp>
</template>
<style>
body {
  color: white;
  font-family: "Gilroy-Bold", "Helvetica Neue", Arial, sans-serif;
}
body.no-scroll {
  overflow: hidden !important;
}

.shadow-style {
  border-radius: 20px;
  box-shadow: 0px 0px 20px rgba(255, 255, 255, 0.08);
}

.global-page-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 16, 16, 0.42);
  backdrop-filter: blur(3px);
}

.global-page-loader__card {
  display: inline-flex;
  min-width: 168px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(38, 38, 38, 0.92);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
  padding: 14px 18px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}

.global-page-loader__icon {
  height: 20px;
  width: 20px;
  animation: global-loader-spin 0.8s linear infinite;
  color: #4993dd;
}

.global-loader-fade-enter-active,
.global-loader-fade-leave-active {
  transition: opacity 0.16s ease;
}

.global-loader-fade-enter-from,
.global-loader-fade-leave-to {
  opacity: 0;
}

@keyframes global-loader-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Р”Р»СЏ Chrome, Safari, Edge */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Р”Р»СЏ Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}
</style>

