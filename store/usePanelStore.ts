// stores/panel.ts
import { defineStore } from 'pinia'

export const usePanelStore = defineStore('panel', {
  state: () => ({
    isOpen: false,
    isQuitConfirm: false
  }),
  actions: {
    toggle() {
      this.isOpen = !this.isOpen
    },
    openQuit() {
      this.isQuitConfirm = true
    },
    closeQuit() {
      this.isQuitConfirm = false
    },
    closeAll() {
      this.isOpen = false
      this.isQuitConfirm = false
    }
  }
})
