<script setup lang="ts">
import UserPanel from "./UserPanel/UserPanel.vue";

const user = {
  name: "Iskandarjon Yusupov",
  location: "Samarqand Darvoza",
  avatarUrl:  
    "https://assets.dyler.com/uploads/cars/415894/9044881/large_952107a9-308d-4d46-a067-b5d90561c07b.jpg",
};

const handleLogout = () => {
  // Здесь можешь отправить запрос на logout
  console.log("User logged out");
};

const openSettings = () => {
  // Переход к настройкам
  console.log("Settings opened");
};
</script>

<template>
  <UserPanel
    :user="user"
    @logout="handleLogout"
    @settings="openSettings"
  />
</template>
