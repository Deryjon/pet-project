<script setup lang="ts">
const route = useRoute();

await navigateTo(`/platform/companies/${String(route.params.id || "").trim()}/overview`, { replace: true });
</script>
