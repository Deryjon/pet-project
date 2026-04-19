<script setup lang="ts">
import { useHead } from "#imports";

useHead({ title: "Настройки компании | Konkurent" });

const sections = [
  {
    title: "Компания",
    description: "Настройте информацию о компании",
    to: "",
  },
  {
    title: "Магазины",
    description: "Настройте список магазинов и их детали",
    to: "/settings/shop",
  },
  {
    title: "Кассы",
    description: "Настройте список касс и их детали",
    to: "",
  },
  {
    title: "Ключи интеграций",
    description: "Настройте список ключей интеграции",
    to: "",
  },
];
</script>

<template>
  <section class="company-settings-page text-white">
    <header class="page-header">
      <p class="page-kicker">Настройки</p>
      <h1>Настройки компании</h1>
    </header>

    <div class="settings-list">
      <article v-for="section in sections" :key="section.title" class="settings-card">
        <div>
          <h2>{{ section.title }}</h2>
          <p>{{ section.description }}</p>
        </div>

        <NuxtLink v-if="section.to" :to="section.to" class="settings-action">
          Настроить
        </NuxtLink>
        <button v-else type="button" class="settings-action">
          Настроить
        </button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.company-settings-page {
  display: grid;
  gap: 24px;
}

.page-header {
  display: grid;
  gap: 8px;
}

.page-kicker {
  color: #79b7ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  font-size: 34px;
  font-weight: 700;
  line-height: 1.05;
}

.settings-list {
  display: grid;
  gap: 14px;
}

.settings-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 96px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  background: #262626;
  padding: 20px;
}

.settings-card h2 {
  font-size: 20px;
  font-weight: 700;
}

.settings-card p {
  margin-top: 6px;
  color: #bdbdbd;
  font-size: 14px;
  line-height: 1.5;
}

.settings-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 16px;
  background: #1f78ff;
  padding: 0 16px;
  color: white;
  font-size: 14px;
  font-weight: 700;
  transition: background 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
}

.settings-action:hover {
  background: #2e84ff;
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .settings-card {
    align-items: stretch;
    flex-direction: column;
  }

  .settings-action {
    width: 100%;
  }
}
</style>
