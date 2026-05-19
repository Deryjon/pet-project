<script setup lang="ts">
const route = useRoute();

await navigateTo(
  {
    path: "/order/new-order",
    query: route.query,
  },
  { replace: true },
);
</script>
