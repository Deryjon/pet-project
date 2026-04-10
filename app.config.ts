export default defineAppConfig({
  ui: {
    colors: {
      primary: "blue",
    },
    button: {
      slots: {
        base: "cursor-pointer disabled:!cursor-pointer aria-disabled:!cursor-pointer active:!bg-transparent focus-visible:!outline-none focus-visible:!ring-0",
      },
    },
    select: {
      slots: {
        content: "z-[80]",
      },
    },
    selectMenu: {
      slots: {
        content: "z-[80]",
      },
    },
    inputMenu: {
      slots: {
        content: "z-[80]",
      },
    },
  },
});
