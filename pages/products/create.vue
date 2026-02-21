<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useHead } from "#imports";
import { useProducts } from "~/composables/useProducts";
import { useProductStore } from "~/store/productStore";

import CreateProductHeader from "@/components/products/CreateProductHeader.vue";
import CreateProductSidebar from "@/components/products/CreateProductSidebar.vue";
import CreateProductMainForm from "@/components/products/CreateProductMainForm.vue";
import CreateProductPrices from "@/components/products/CreateProductPrices.vue";
import CreateProductStocks from "@/components/products/CreateProductStocks.vue";
import CreateProductFeatures from "@/components/products/CreateProductFeatures.vue";

definePageMeta({ layout: "empty" });

const router = useRouter();
const store = useProductStore();
const { createProduct } = useProducts();
const submitting = ref(false);

useHead({
  title: "Новый продукт | Konkurent.cases",
  meta: [{ name: "description", content: "Описание страницы" }],
});

// refs для секций
const mainRef = ref<HTMLElement | null>(null);
const pricesRef = ref<HTMLElement | null>(null);
const stocksRef = ref<HTMLElement | null>(null);
const featuresRef = ref<HTMLElement | null>(null);

function scrollTo(section: string) {
  const map: Record<string, HTMLElement | null> = {
    main: mainRef.value,
    prices: pricesRef.value,
    stocks: stocksRef.value,
    features: featuresRef.value,
  };

  const el = map[section];
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function onCreate() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const totalQty = (store.stores || []).reduce((sum, s: any) => sum + (s?.qty || 0), 0);

    // map UI selections to API enums with safe defaults
    const product_type = (() => {
      // assume first option is goods, second is service if present
      const idx = (store as any).productTypes?.indexOf((store as any).selectedProductType) ?? 0;
      return idx === 0 ? 'goods' : 'service';
    })();
    const variant_type = (() => {
      const idx = (store as any).productVariants?.indexOf((store as any).selectedVariant) ?? 0;
      return idx === 0 ? 'simple' : 'variant';
    })();

    const unit = (store as any).selectedUnit || 'Штука';
    const markup_percent = (store as any).markup_percent ?? 0;

    // Start with required/base fields only
    const payload: any = {
      name: (store as any).name || "",
      sku: store.article || "",
      barcode: store.barcode || "",
      supplier_ids: [] as number[],
      product_type,
      variant_type,
      unit,
      markup_percent: Number(markup_percent) || 0,
      quantity: totalQty,
      purchase_price: Number((store as any).purchase_price) || 0,
      sale_price: Number((store as any).sale_price) || 0,
    };

    // photo: send only if provided (prefer null over empty string; else omit)
    const photo = (store as any).photo;
    if (typeof photo === 'string' && photo.trim().length > 0) {
      payload.photo = photo.trim();
    }

    // category_id / brand_id: send only if valid positive ids
    const categoryId = (store as any).category_id;
    if (typeof categoryId === 'number' && categoryId > 0) {
      payload.category_id = categoryId;
    }
    const brandId = (store as any).brand_id;
    if (typeof brandId === 'number' && brandId > 0) {
      payload.brand_id = brandId;
    }

    // stocks: include only valid branch_code entries (>=2 chars) and deduplicate by branch_code
    const rawStocks = (store.stores || [])
      .map((s: any) => {
        const code = (s?.code ?? '').toString().trim();
        if (!code || code.length < 2) return null;
        const qty = Number(s?.qty) || 0;
        if (qty <= 0) return null;
        return {
          branch_code: code,
          quantity: qty,
          purchase_price: Number((store as any).purchase_price) || 0,
          sale_price: Number((store as any).sale_price) || 0,
        };
      })
      .filter(Boolean) as any[];

    if (rawStocks.length > 0) {
      const seen = new Set<string>();
      payload.stocks = rawStocks.filter((st) => {
        if (seen.has(st.branch_code)) return false;
        seen.add(st.branch_code);
        return true;
      });
    }

    await createProduct(payload as any);
    router.push("/products/catalog");
  } catch (e) {
    console.error("Failed to create product", e);
    // Optionally handle error UI here
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="operations">
    <CreateProductHeader @create="onCreate" />
    <div class="flex gap-10 mx-auto px-[144px] mt-8">
      <!-- Sidebar ловит клики -->
      <CreateProductSidebar @scrollTo="scrollTo" />

      <div class="right flex-1 px-8">
        <div ref="mainRef">
          <CreateProductMainForm />
        </div>
        <div ref="pricesRef" class="mt-12">
          <CreateProductPrices />
        </div>
        <div ref="stocksRef" class="mt-12">
          <CreateProductStocks />
        </div>
        <div ref="featuresRef" class="mt-12 pb-12">
          <CreateProductFeatures />
        </div>
      </div>
    </div>
  </section>
</template>

<style>
@reference "tailwindcss";

input,
select {
  @apply bg-[#404040] p-[15px] text-[16px] font-semibold rounded-[15px] transition-all duration-300 hover:bg-[#5e5e5e];
}
</style>
