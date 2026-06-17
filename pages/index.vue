<script setup lang="ts">
import { computed, ref } from "vue";
import { useUserStore } from "~/store/useUserStore";
import { useRouter } from "vue-router";

definePageMeta({ layout: false });
useHead({ title: "Konkurent CRM — Управляйте бизнесом с умом" });

const userStore = useUserStore();
const router = useRouter();

const isAuth = computed(() => userStore.isAuthenticated);

function goToDashboard() {
  router.push("/dashboard");
}

function goToLogin() {
  router.push("/auth/login");
}

const features = [
  {
    icon: "heroicons:chart-bar",
    title: "Аналитика и отчёты",
    desc: "Видите продажи, прибыль и остатки в реальном времени. Все цифры на одном экране.",
  },
  {
    icon: "heroicons:users",
    title: "Управление сотрудниками",
    desc: "Назначайте роли, контролируйте доступ, смотрите зарплату и эффективность каждого.",
  },
  {
    icon: "heroicons:shopping-cart",
    title: "Точка продаж (POS)",
    desc: "Быстрое оформление заказов, работа с кассой, скидки и чеки прямо в браузере.",
  },
  {
    icon: "heroicons:cube",
    title: "Склад и инвентаризация",
    desc: "Отслеживайте остатки, проводите переоценку, контролируйте списания и перемещения.",
  },
  {
    icon: "heroicons:truck",
    title: "Поставщики и закупки",
    desc: "Ведите базу поставщиков, оформляйте приходы товара, контролируйте долги.",
  },
  {
    icon: "heroicons:document-chart-bar",
    title: "Импорт данных",
    desc: "Загружайте каталоги и остатки из Excel — без ручного ввода и ошибок.",
  },
];

const problems = [
  { emoji: "😰", text: "Не знаете, сколько товара на складе — заказываете вслепую" },
  { emoji: "📊", text: "Нет понимания, какой продукт прибыльный, а какой убыточный" },
  { emoji: "👷", text: "Сотрудники работают без контроля — кто что делает непонятно" },
  { emoji: "📝", text: "Все данные в Excel и тетради — ничего не найти, всё теряется" },
  { emoji: "💸", text: "Деньги уходят непонятно куда — учёт ведётся на глаз" },
  { emoji: "⏱️", text: "Обслуживание клиентов медленное — очереди и ошибки при продаже" },
];

const steps = [
  { num: "01", title: "Регистрируйтесь", desc: "Создайте аккаунт компании за 2 минуты. Никакой установки." },
  { num: "02", title: "Заполните каталог", desc: "Импортируйте товары из Excel или добавьте вручную." },
  { num: "03", title: "Добавьте сотрудников", desc: "Назначьте роли: кассир, менеджер, администратор." },
  { num: "04", title: "Начинайте продавать", desc: "Открывайте POS-терминал и оформляйте первые продажи." },
];

const plans = [
  {
    name: "Старт",
    price: "299 000",
    oldPrice: "990 000",
    period: "сум / мес",
    highlight: false,
    desc: "Для малого бизнеса с одной точкой продаж",
    items: [
      "1 магазин / точка",
      "До 5 сотрудников",
      "POS-терминал",
      "Базовые отчёты",
      "Управление складом",
      "Поддержка по email",
    ],
  },
  {
    name: "Бизнес",
    price: "699 000",
    oldPrice: "2 490 000",
    period: "сум / мес",
    highlight: true,
    badge: "Популярный",
    desc: "Для растущего бизнеса с несколькими точками",
    items: [
      "До 3 магазинов",
      "До 20 сотрудников",
      "Полный POS",
      "Расширенная аналитика",
      "Импорт из Excel",
      "Управление поставщиками",
      "Приоритетная поддержка",
    ],
  },
  {
    name: "Про",
    price: "1 290 000",
    oldPrice: "4 990 000",
    period: "сум / мес",
    highlight: false,
    desc: "Для крупных компаний без ограничений",
    items: [
      "Неограниченно магазинов",
      "Неограниченно сотрудников",
      "Все функции",
      "Детальная аналитика",
      "API-интеграции",
      "Персональный менеджер",
      "SLA поддержка 24/7",
    ],
  },
];

const form = ref({ name: "", phone: "", company: "", message: "" });
const formSent = ref(false);
const formLoading = ref(false);

function submitForm() {
  if (!form.value.name || !form.value.phone) return;
  formLoading.value = true;
  setTimeout(() => {
    formLoading.value = false;
    formSent.value = true;
  }, 900);
}
</script>

<template>
  <div class="landing">
    <!-- NAV -->
    <nav class="landing-nav">
      <div class="nav-inner">
        <div class="nav-brand" :class="isAuth ? 'nav-brand-clickable' : ''" @click="isAuth ? goToDashboard() : undefined">
          <div class="nav-logo">K</div>
          <div class="nav-brand-text">
            <span class="nav-name">Konkurent CRM</span>
            <span class="nav-tagline">Система управления бизнесом</span>
          </div>
        </div>
        <div class="nav-links">
          <a href="#pricing" class="nav-link">Тарифы</a>
          <a href="#contact" class="nav-link">Контакты</a>
        </div>
        <div class="nav-actions">
          <button v-if="isAuth" class="btn-outline" @click="goToDashboard">
            Перейти в систему
          </button>
          <template v-else>
            <button class="btn-outline" @click="goToLogin">Войти</button>
            <button class="btn-primary" @click="goToLogin">Попробовать бесплатно</button>
          </template>
        </div>
      </div>
    </nav>

    <!-- PAGE BODY CONTAINER -->
    <div class="page-body">

    <!-- HERO -->
    <section class="hero">
      <div class="hero-glow hero-glow-1" />
      <div class="hero-glow hero-glow-2" />
      <div class="section-inner hero-inner">
        <div class="hero-badge">CRM для розничного бизнеса</div>
        <h1 class="hero-title">
          Управляйте бизнесом<br />
          <span class="hero-accent">без хаоса и потерь</span>
        </h1>
        <p class="hero-sub">
          Konkurent CRM — единая система для продаж, склада, сотрудников и аналитики.
          Всё что нужно для роста бизнеса — в одном окне браузера.
        </p>
        <div class="hero-cta">
          <button class="btn-primary btn-lg" @click="goToLogin">
            Начать бесплатно
          </button>
          <a href="#how" class="btn-ghost btn-lg">Как это работает →</a>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-num">500+</span>
            <span class="stat-label">компаний</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-num">2 мин</span>
            <span class="stat-label">до старта</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-num">99.9%</span>
            <span class="stat-label">uptime</span>
          </div>
        </div>
      </div>
    </section>

    <!-- PROBLEM -->
    <section class="section-alt">
      <div class="section-inner">
        <div class="section-label">Знакомая картина?</div>
        <h2 class="section-title">Бизнес без CRM — это постоянный стресс</h2>
        <p class="section-sub">
          Каждый день предприниматели теряют деньги и время из-за отсутствия нормального учёта
        </p>
        <div class="problems-grid">
          <div v-for="p in problems" :key="p.text" class="problem-card">
            <span class="problem-emoji">{{ p.emoji }}</span>
            <p class="problem-text">{{ p.text }}</p>
          </div>
        </div>
        <div class="problem-cta">
          <p class="problem-cta-text">Узнаёте свою ситуацию? Пора это исправить.</p>
          <button class="btn-primary" @click="goToLogin">Попробовать Konkurent CRM</button>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="section-dark">
      <div class="section-inner">
        <div class="section-label">Возможности</div>
        <h2 class="section-title">Всё для вашего бизнеса — в одной системе</h2>
        <p class="section-sub">
          Не нужно платить за 5 разных программ. Konkurent CRM закрывает все задачи
        </p>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-icon-wrap">
              <Icon :name="f.icon" class="feature-icon" />
            </div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how" class="section-alt">
      <div class="section-inner">
        <div class="section-label">Как начать</div>
        <h2 class="section-title">Запуск за 4 шага</h2>
        <p class="section-sub">Никакой установки, никаких серверов. Всё работает в браузере</p>
        <div class="steps-grid">
          <div v-for="s in steps" :key="s.num" class="step-card">
            <div class="step-num">{{ s.num }}</div>
            <h3 class="step-title">{{ s.title }}</h3>
            <p class="step-desc">{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING -->
    <section id="pricing" class="section-dark">
      <div class="section-inner">
        <div class="section-label">Тарифы</div>
        <h2 class="section-title">Прозрачные цены</h2>
        <p class="section-sub">Никаких скрытых платежей. Выберите план под ваш бизнес</p>
        <div class="plans-grid">
          <div
            v-for="plan in plans"
            :key="plan.name"
            :class="['plan-card', plan.highlight ? 'plan-card-highlight' : '']"
          >
            <div v-if="plan.badge" class="plan-badge">{{ plan.badge }}</div>
            <div class="plan-name">{{ plan.name }}</div>
            <div class="plan-price-row">
              <span class="plan-old-price">{{ plan.oldPrice }}</span>
              <span class="plan-price">{{ plan.price }}</span>
              <span class="plan-period">{{ plan.period }}</span>
            </div>
            <p class="plan-desc">{{ plan.desc }}</p>
            <ul class="plan-items">
              <li v-for="item in plan.items" :key="item" class="plan-item">
                <Icon name="heroicons:check" class="plan-check" />
                {{ item }}
              </li>
            </ul>
            <button
              :class="plan.highlight ? 'btn-primary plan-btn' : 'btn-outline plan-btn'"
              @click="goToLogin"
            >
              Начать
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- BOTTOM CTA -->
    <section class="section-cta">
      <div class="cta-glow" />
      <div class="section-inner cta-inner">
        <h2 class="cta-title">Готовы навести порядок в бизнесе?</h2>
        <p class="cta-sub">
          Попробуйте Konkurent CRM бесплатно. Первые 14 дней — без оплаты
        </p>
        <button class="btn-primary btn-lg" @click="goToLogin">
          Зарегистрировать компанию →
        </button>
      </div>
    </section>

    <!-- CONTACT FORM -->
    <section id="contact" class="section-alt">
      <div class="section-inner">
        <div class="contact-layout">
          <div class="contact-info">
            <div class="section-label">Связаться с нами</div>
            <h2 class="section-title">Оставьте заявку — мы перезвоним</h2>
            <p class="section-sub" style="margin-bottom: 32px;">
              Расскажем про возможности, поможем выбрать тариф и подключим систему за 1 день
            </p>
            <ul class="contact-benefits">
              <li>
                <Icon name="heroicons:check-circle" class="cb-icon" />
                Бесплатная демонстрация системы
              </li>
              <li>
                <Icon name="heroicons:check-circle" class="cb-icon" />
                Поможем перенести данные из Excel
              </li>
              <li>
                <Icon name="heroicons:check-circle" class="cb-icon" />
                Обучение сотрудников включено
              </li>
              <li>
                <Icon name="heroicons:check-circle" class="cb-icon" />
                Ответим в течение 30 минут
              </li>
            </ul>
          </div>

          <div class="contact-form-wrap">
            <div v-if="formSent" class="form-success">
              <Icon name="heroicons:check-circle" class="form-success-icon" />
              <h3>Заявка отправлена!</h3>
              <p>Мы свяжемся с вами в течение 30 минут</p>
            </div>
            <form v-else class="contact-form" @submit.prevent="submitForm">
              <h3 class="form-title">Оставить заявку</h3>
              <div class="form-field">
                <label class="form-label">Ваше имя *</label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Иван Иванов"
                  class="form-input"
                  required
                />
              </div>
              <div class="form-field">
                <label class="form-label">Телефон *</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  class="form-input"
                  required
                />
              </div>
              <div class="form-field">
                <label class="form-label">Название компании</label>
                <input
                  v-model="form.company"
                  type="text"
                  placeholder="ООО Ромашка"
                  class="form-input"
                />
              </div>
              <div class="form-field">
                <label class="form-label">Комментарий</label>
                <textarea
                  v-model="form.message"
                  placeholder="Расскажите о вашем бизнесе..."
                  class="form-input form-textarea"
                  rows="3"
                />
              </div>
              <button type="submit" class="btn-primary form-submit" :disabled="formLoading">
                <Icon v-if="formLoading" name="heroicons:arrow-path" class="spin-icon" />
                {{ formLoading ? "Отправляем..." : "Отправить заявку" }}
              </button>
              <p class="form-note">Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности</p>
            </form>
          </div>
        </div>
      </div>
    </section>

    </div><!-- /page-body -->

    <!-- FOOTER -->
    <footer class="landing-footer">
      <div class="footer-inner-wrap">
        <div class="footer-top">
          <div class="footer-col footer-col-brand">
            <div class="footer-brand">
              <div class="footer-logo">K</div>
              <span class="footer-name">Konkurent CRM</span>
            </div>
            <p class="footer-about">
              Система управления бизнесом для розничных магазинов и сервисных компаний Узбекистана.
            </p>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Продукт</div>
            <ul class="footer-links">
              <li><a href="#" class="footer-link">Возможности</a></li>
              <li><a href="#pricing" class="footer-link">Тарифы</a></li>
              <li><a href="#how" class="footer-link">Как начать</a></li>
              <li><a href="#contact" class="footer-link">Демо</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Компания</div>
            <ul class="footer-links">
              <li><a href="#" class="footer-link">О нас</a></li>
              <li><a href="#contact" class="footer-link">Контакты</a></li>
              <li><a href="#" class="footer-link">Поддержка</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Контакты</div>
            <ul class="footer-links">
              <li class="footer-contact-item">
                <Icon name="heroicons:phone" class="footer-contact-icon" />
                +998 71 123 45 67
              </li>
              <li class="footer-contact-item">
                <Icon name="heroicons:envelope" class="footer-contact-icon" />
                info@konkurent.uz
              </li>
              <li class="footer-contact-item">
                <Icon name="heroicons:map-pin" class="footer-contact-icon" />
                Ташкент, Узбекистан
              </li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-copy">© 2025 Konkurent CRM. Все права защищены.</p>
          <div class="footer-bottom-links">
            <a href="#" class="footer-bottom-link">Политика конфиденциальности</a>
            <a href="#" class="footer-bottom-link">Условия использования</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ─── base ─── */
.landing {
  min-height: 100vh;
  background: #0b0f1a;
  color: #e8edf5;
  font-family: inherit;
  overflow-x: hidden;
}

.section-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 60px;
}

/* ─── page body container ─── */
.page-body {
  margin: 0 auto;
  border-left: 1px solid rgba(86, 148, 233, 0.18);
  border-right: 1px solid rgba(86, 148, 233, 0.18);
  background: linear-gradient(180deg, #0f1624 0%, #0b0f1a 40%);
}

/* ─── nav ─── */
.landing-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(86, 148, 233, 0.18);
  background: rgba(11, 15, 26, 0.94);
  backdrop-filter: blur(18px);
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-brand-clickable {
  cursor: pointer;
  border-radius: 12px;
  padding: 4px 8px;
  margin: -4px -8px;
  transition: background 0.2s;
}

.nav-brand-clickable:hover {
  background: rgba(255, 255, 255, 0.06);
}

.nav-logo {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(31, 120, 255, 0.25);
  border: 1px solid rgba(86, 148, 233, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  color: #7ec4ff;
  flex-shrink: 0;
}

.nav-brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1;
}

.nav-tagline {
  font-size: 0.72rem;
  color: rgba(196, 225, 255, 0.55);
  letter-spacing: 0.04em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 auto;
}

.nav-link {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  color: rgba(196, 225, 255, 0.75);
  transition: color 0.2s, background 0.2s;
  text-decoration: none;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* ─── buttons ─── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 22px;
  border-radius: 12px;
  background: #1f78ff;
  color: #f0f6ff;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.btn-primary:hover {
  background: #2b84ff;
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(31, 120, 255, 0.28);
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 22px;
  border-radius: 12px;
  border: 1px solid rgba(86, 148, 233, 0.28);
  color: rgba(196, 225, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 500;
  transition: border-color 0.2s, background 0.2s;
  cursor: pointer;
}

.btn-outline:hover {
  border-color: rgba(86, 148, 233, 0.55);
  background: rgba(31, 120, 255, 0.08);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 22px;
  color: rgba(196, 225, 255, 0.75);
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
  text-decoration: none;
  cursor: pointer;
}

.btn-ghost:hover {
  color: rgba(196, 225, 255, 1);
}

.btn-lg {
  padding: 14px 30px;
  font-size: 1rem;
  border-radius: 14px;
}

/* ─── hero ─── */
.hero {
  position: relative;
  padding: 100px 0 80px;
  text-align: center;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
}

.hero-glow-1 {
  width: 700px;
  height: 500px;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(31, 120, 255, 0.22);
}

.hero-glow-2 {
  width: 450px;
  height: 350px;
  bottom: -60px;
  right: 8%;
  background: rgba(100, 60, 220, 0.12);
}

.hero-inner {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 999px;
  background: rgba(31, 120, 255, 0.18);
  border: 1px solid rgba(86, 148, 233, 0.4);
  color: rgba(196, 225, 255, 0.95);
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 28px;
}

.hero-title {
  font-size: clamp(2.2rem, 5vw, 3.8rem);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: #fff;
  margin-bottom: 20px;
}

.hero-accent {
  background: linear-gradient(90deg, #4da3ff, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-sub {
  max-width: 580px;
  margin: 0 auto 36px;
  font-size: 1.05rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.75);
}

.hero-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 56px;
}

.hero-stats {
  display: inline-flex;
  align-items: center;
  gap: 24px;
  padding: 18px 32px;
  border-radius: 20px;
  border: 1px solid rgba(86, 148, 233, 0.28);
  background: rgba(15, 25, 50, 0.7);
  backdrop-filter: blur(10px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 1.45rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.76rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
}

/* ─── sections ─── */
.section-dark {
  padding: 90px 0;
  background: #0d1220;
}

.section-alt {
  padding: 90px 0;
  background: #111827;
}

.section-label {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #5db8ff;
  margin-bottom: 16px;
}

.section-title {
  font-size: clamp(1.7rem, 3.5vw, 2.4rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #fff;
  margin-bottom: 14px;
}

.section-sub {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.68);
  max-width: 560px;
  line-height: 1.6;
  margin-bottom: 52px;
}

/* ─── problems ─── */
.problems-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 44px;
}

.problem-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 22px;
  border-radius: 16px;
  border: 1px solid rgba(248, 113, 113, 0.22);
  background: rgba(248, 113, 113, 0.07);
}

.problem-emoji {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.problem-text {
  font-size: 0.93rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

.problem-cta {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 24px 28px;
  border-radius: 18px;
  border: 1px solid rgba(31, 120, 255, 0.3);
  background: rgba(31, 120, 255, 0.1);
}

.problem-cta-text {
  flex: 1;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  min-width: 200px;
}

/* ─── features ─── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 28px;
  border-radius: 20px;
  border: 1px solid rgba(86, 148, 233, 0.22);
  background: rgba(15, 25, 50, 0.6);
  transition: border-color 0.2s, background 0.2s, transform 0.2s;
}

.feature-card:hover {
  border-color: rgba(86, 148, 233, 0.48);
  background: rgba(31, 120, 255, 0.1);
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(31, 120, 255, 0.12);
}

.feature-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(31, 120, 255, 0.2);
  border: 1px solid rgba(86, 148, 233, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.feature-icon {
  width: 22px;
  height: 22px;
  color: #4da3ff;
}

.feature-title {
  font-size: 1.02rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 10px;
}

.feature-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.6;
}

/* ─── steps ─── */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.step-card {
  padding: 28px;
  border-radius: 20px;
  border: 1px solid rgba(86, 148, 233, 0.22);
  background: rgba(15, 25, 50, 0.55);
}

.step-num {
  font-size: 2rem;
  font-weight: 800;
  color: rgba(77, 163, 255, 0.55);
  letter-spacing: -0.05em;
  margin-bottom: 14px;
}

.step-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.step-desc {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.55;
}

/* ─── plans ─── */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 20px;
  align-items: start;
}

.plan-card {
  position: relative;
  padding: 32px;
  border-radius: 24px;
  border: 1px solid rgba(86, 148, 233, 0.25);
  background: rgba(15, 25, 50, 0.6);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.plan-card-highlight {
  border-color: rgba(31, 120, 255, 0.55);
  background: rgba(31, 120, 255, 0.1);
  box-shadow: 0 0 60px rgba(31, 120, 255, 0.18);
}

.plan-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 14px;
  border-radius: 999px;
  background: #1f78ff;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.plan-name {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(196, 225, 255, 0.85);
  margin-bottom: 14px;
}

.plan-price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.plan-old-price {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.38);
  text-decoration: line-through;
}

.plan-price {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.03em;
}

.plan-period {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.6);
}

.plan-desc {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 24px;
  line-height: 1.5;
}

.plan-items {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 11px;
  margin-bottom: 28px;
}

.plan-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.88);
}

.plan-check {
  width: 16px;
  height: 16px;
  color: #4da3ff;
  flex-shrink: 0;
}

.plan-btn {
  width: 100%;
  margin-top: auto;
}

/* ─── bottom cta ─── */
.section-cta {
  position: relative;
  padding: 100px 0;
  text-align: center;
  overflow: hidden;
  background: linear-gradient(180deg, #111827 0%, #0d1220 100%);
}

.cta-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(31, 120, 255, 0.22), transparent 60%);
  pointer-events: none;
}

.cta-inner {
  position: relative;
  z-index: 1;
}

.cta-title {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #fff;
  margin-bottom: 16px;
}

.cta-sub {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.72);
  max-width: 420px;
  margin: 0 auto 36px;
  line-height: 1.6;
}

/* ─── contact form ─── */
.contact-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: start;
}

.contact-benefits {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.contact-benefits li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.82);
}

.cb-icon {
  width: 20px;
  height: 20px;
  color: #4da3ff;
  flex-shrink: 0;
}

.contact-form-wrap {
  background: rgba(15, 25, 50, 0.7);
  border: 1px solid rgba(86, 148, 233, 0.25);
  border-radius: 24px;
  padding: 36px;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 24px;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(196, 225, 255, 0.7);
}

.form-input {
  width: 100%;
  padding: 13px 16px;
  border-radius: 12px;
  border: 1px solid rgba(86, 148, 233, 0.25);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.32);
}

.form-input:focus {
  border-color: rgba(77, 163, 255, 0.55);
  box-shadow: 0 0 0 3px rgba(31, 120, 255, 0.12);
}

.form-textarea {
  resize: vertical;
  min-height: 90px;
}

.form-submit {
  width: 100%;
  padding: 14px;
  font-size: 1rem;
  gap: 8px;
}

.spin-icon {
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-note {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
  text-align: center;
}

.form-success {
  text-align: center;
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.form-success-icon {
  width: 52px;
  height: 52px;
  color: #4da3ff;
}

.form-success h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
}

.form-success p {
  color: rgba(255, 255, 255, 0.65);
}

/* ─── footer ─── */
.landing-footer {
  border-top: 1px solid rgba(86, 148, 233, 0.18);
  background: #080c17;
}

.footer-inner-wrap {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
}

.footer-top {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 48px;
  padding: 56px 0 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.footer-logo {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(31, 120, 255, 0.25);
  border: 1px solid rgba(86, 148, 233, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  color: #7ec4ff;
  flex-shrink: 0;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.footer-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}

.footer-about {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.48);
  line-height: 1.65;
  max-width: 260px;
}

.footer-col-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(196, 225, 255, 0.6);
  margin-bottom: 16px;
}

.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-link {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: rgba(255, 255, 255, 0.9);
}

.footer-contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.6);
}

.footer-contact-icon {
  width: 16px;
  height: 16px;
  color: #4da3ff;
  flex-shrink: 0;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 0;
  flex-wrap: wrap;
}

.footer-copy {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.38);
}

.footer-bottom-links {
  display: flex;
  gap: 20px;
}

.footer-bottom-link {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.38);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-bottom-link:hover {
  color: rgba(255, 255, 255, 0.7);
}

/* ─── responsive ─── */
@media (max-width: 1024px) {
  .section-inner {
    padding: 0 32px;
  }

  .contact-layout {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .footer-top {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }

  .nav-links {
    display: none;
  }
}

@media (max-width: 640px) {
  .section-inner {
    padding: 0 20px;
  }

  .hero {
    padding: 70px 0 60px;
  }

  .hero-stats {
    gap: 16px;
    padding: 14px 20px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .stat-divider {
    display: none;
  }

  .nav-inner {
    padding: 0 20px;
    height: 68px;
  }

  .nav-actions .btn-outline {
    display: none;
  }

  .nav-tagline {
    display: none;
  }

  .section-dark,
  .section-alt {
    padding: 64px 0;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .steps-grid {
    grid-template-columns: 1fr 1fr;
  }

  .problem-cta {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-top {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 36px 0 28px;
  }

  .footer-inner-wrap {
    padding: 0 20px;
  }

  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }

  .contact-form-wrap {
    padding: 24px;
  }
}
</style>
