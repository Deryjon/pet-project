<script setup lang="ts">
definePageMeta({ layout: "platform" });

const route = useRoute();
await navigateTo(`/platform/companies/${route.params.id}/overview`, { replace: true });
</script>
