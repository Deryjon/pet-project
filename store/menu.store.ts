export const useMenuStore = defineStore('pinia', {
    state: () => ({
      isOpen: false,
    }),
    actions: {
      toggleMenu() {
        this.isOpen = !this.isOpen;
      },
      setIsOpen(value: boolean) {
        this.isOpen = value;
      },
    },
  
    getters: {
      isMenuOpen(): boolean {
        return this.isOpen;
      }
    }
  });