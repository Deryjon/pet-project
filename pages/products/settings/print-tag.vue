<template>
  <section class="operations">
    <!-- Верхняя панель -->
    <div class="border-b">
      <div class="mx-auto px-[144px]">
        <div class="top flex items-center justify-between gap-4 py-[32px]">
          <div class="flex items-center gap-4">
            <div
              class="exit bg-[#404040] px-[15px] py-[12px] rounded-[25px] flex items-center gap-2 justify-center cursor-pointer font-bold text-[16px] hover:bg-[#5e5e5e] transition-colors duration-300"
              @click="router.back()"
            >
              <Icon name="heroicons:chevron-left" class="w-5 h-5 text-muted-foreground" />
              Массовые операции
            </div>
            <h2 class="text-[28px] font-bold">Печать ценников</h2>
          </div>
          <div class="buttons flex items-center gap-4">
            <button class="btn-dark">Тестовая печать</button>
            <button class="bg-[#1f78ff] px-[15px] py-[12px] text-[16px] font-semibold rounded-[20px] transition-all duration-300 hover:bg-[#4d94ff]">Печатать все</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Контент -->
    <div class="mx-auto px-[144px] mt-8 flex gap-8">
      <!-- Левая колонка: настройки -->
      <div class="w-1/2 space-y-6">

        <!-- Шаблон ценника -->
        <div>
          <span class="label">Шаблон ценника</span>
          <div class="relative" ref="templateRef">
            <div
              class="input cursor-pointer flex items-center justify-between"
              @click="toggleDropdown('template')"
            >
              {{ form.template }}
              <Icon name="heroicons:chevron-down" />
            </div>
            <transition name="fade">
              <ul
                v-if="dropdownOpen.template"
                class="absolute left-0 mt-1 w-full bg-[#2e2e2e] rounded-xl shadow-md overflow-hidden z-10 max-h-48 overflow-y-auto"
              >
                <li
                  v-for="option in templates"
                  :key="option"
                  @mousedown.prevent="selectOption('template', option)"
                  class="px-4 py-2 hover:bg-[#505050] cursor-pointer text-white"
                >
                  {{ option }}
                </li>
              </ul>
            </transition>
          </div>
        </div>

        <!-- Магазин -->
        <div>
          <span class="label">Магазин</span>
          <div class="relative" ref="storeRef">
            <div
              class="input cursor-pointer flex items-center justify-between"
              @click="toggleDropdown('store')"
            >
              {{ form.store }}
              <Icon name="heroicons:chevron-down" />
            </div>
            <transition name="fade">
              <ul
                v-if="dropdownOpen.store"
                class="absolute left-0 mt-1 w-full bg-[#2e2e2e] rounded-xl shadow-md overflow-hidden z-10 max-h-48 overflow-y-auto"
              >
                <li
                  v-for="option in stores"
                  :key="option"
                  @mousedown.prevent="selectOption('store', option)"
                  class="px-4 py-2 hover:bg-[#505050] cursor-pointer text-white"
                >
                  {{ option }}
                </li>
              </ul>
            </transition>
          </div>
        </div>

        <!-- Количество ценников -->
        <label class="block">
          <span class="label">Количество ценников</span>
          <input type="number" min="1" v-model="form.count" class="input" />
        </label>

        <!-- Режим -->
        <div class="flex gap-4">
          <label class="radio">
            <input type="radio" value="manual" v-model="form.mode" />
            <span>Ручной ввод</span>
          </label>
          <label class="radio">
            <input type="radio" value="stock" v-model="form.mode" />
            <span>По остаткам</span>
          </label>
        </div>

        <!-- Чекбоксы -->
        <label class="checkbox">
          <input type="checkbox" v-model="form.customDiscount" />
          <span>Отобразить кастомную скидку</span>
        </label>
        <label class="checkbox">
          <input type="checkbox" v-model="form.a4" />
          <span>Печать на A4</span>
        </label>

        <!-- Принтер -->
        <div>
          <span class="label">Принтер</span>
          <div class="relative" ref="printerRef">
            <div
              class="input cursor-pointer flex items-center justify-between"
              @click="toggleDropdown('printer')"
            >
              {{ form.printer }}
              <Icon name="heroicons:chevron-down" />
            </div>
            <transition name="fade">
              <ul
                v-if="dropdownOpen.printer"
                class="absolute left-0 mt-1 w-full bg-[#2e2e2e] rounded-xl shadow-md overflow-hidden z-10 max-h-48 overflow-y-auto"
              >
                <li
                  v-for="option in printers"
                  :key="option"
                  @mousedown.prevent="selectOption('printer', option)"
                  class="px-4 py-2 hover:bg-[#505050] cursor-pointer text-white"
                >
                  {{ option }}
                </li>
              </ul>
            </transition>
          </div>
        </div>

      </div>

      <!-- Правая колонка: превью -->
      <div class="w-1/2">
        <h3 class="font-semibold mb-4">Образец ценника</h3>
        <transition name="fade-slide" mode="out-in" class="bg-[#404040]">
          <div
            :key="JSON.stringify(form)"
            class="bg-[#404040] text-white p-6 rounded-lg shadow-xl w-[250px] h-[150px] flex flex-col justify-between border border-gray-300"
          >
            <div class="text-lg font-bold">{{ form.template }}</div>
            <div>{{ form.store }}</div>
            <div>Кол-во: {{ form.count }}</div>
            <div v-if="form.customDiscount" class="text-red-600 font-bold">Скидка: -10%</div>
          </div>
        </transition>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useHead, definePageMeta } from "#imports";
import { useRouter } from "#app";

const router = useRouter();

useHead({
  title: "Печать ценников | Konkurent.cases",
  meta: [{ name: "description", content: "Описание страницы" }],
});

definePageMeta({
  layout: "empty",
});

const form = ref({
  template: "Ценник 1",
  store: "Все магазины",
  count: 1,
  mode: "manual",
  customDiscount: false,
  a4: false,
  printer: "Holder XP211",
});

const templates = ["Ценник 1", "Ценник 2", "Ценник 3"];
const stores = ["Все магазины", "Магазин №1", "Магазин №2"];
const printers = ["Holder XP211", "Holder XP212"];

const dropdownOpen = ref({
  template: false,
  store: false,
  printer: false,
});

const templateRef = ref();
const storeRef = ref();
const printerRef = ref();

function toggleDropdown(name: keyof typeof dropdownOpen.value) {
  dropdownOpen.value[name] = !dropdownOpen.value[name];
}

function selectOption(name: keyof typeof form.value, value: string) {
  form.value[name] = value;
  dropdownOpen.value[name as keyof typeof dropdownOpen.value] = false;
}

function handleClickOutside(event: MouseEvent) {
  if (
    !templateRef.value?.contains(event.target) &&
    !storeRef.value?.contains(event.target) &&
    !printerRef.value?.contains(event.target)
  ) {
    dropdownOpen.value = { template: false, store: false, printer: false };
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.btn-dark {
  @apply bg-[#404040] px-[15px] py-[12px] text-[16px] font-semibold rounded-[20px] transition-all duration-300 hover:bg-[#5e5e5e];
}
.input {
  @apply w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#404040] text-white transition-all duration-300;
}
.input:focus {
  @apply border-[#1f78ff] shadow-md outline-none;
}

.label {
  @apply block mb-3 text-sm font-semibold ;
}

.checkbox {
  @apply flex items-center gap-2 cursor-pointer;
}
.checkbox input {
  @apply w-4 h-4 accent-[#1f78ff];
}

.radio {
  @apply flex items-center gap-2 cursor-pointer;
}
.radio input {
  @apply w-4 h-4 accent-[#1f78ff];
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
