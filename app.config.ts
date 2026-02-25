export default defineAppConfig({
  ui: {
    colors: {
      primary: "blue",
    },
    button: {
      slots: {
        base: "cursor-pointer disabled:!cursor-pointer aria-disabled:!cursor-pointer hover:!bg-transparent hover:!text-inherit active:!bg-transparent focus-visible:!outline-none focus-visible:!ring-0",
      },
    },
  },
});
