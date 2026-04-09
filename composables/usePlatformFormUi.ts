export function usePlatformFormUi() {
  const inputUi = {
    root: "w-full",
    base: "w-full cursor-text rounded-2xl border-0 bg-white/90 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-400/60",
  };

  const softInputUi = {
    root: "w-full",
    base: "w-full cursor-text rounded-2xl border-0 bg-slate-50 px-4 py-3 text-[14px] text-slate-700 ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-400/60",
  };

  const selectUi = {
    base: "flex min-h-[48px] w-full items-center justify-between gap-3 cursor-pointer rounded-2xl border-0 bg-white/90 px-4 py-3 text-left text-[14px] text-slate-700 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-teal-400/60",
    value: "truncate",
    placeholder: "truncate text-slate-400",
    trailing: "shrink-0 text-slate-400",
    content: "z-[80] max-h-72 rounded-2xl border border-slate-200 bg-white/98 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl",
    item: "cursor-pointer rounded-xl px-3 py-2 text-[14px] text-slate-700 data-[highlighted]:bg-teal-50 data-[highlighted]:text-slate-900",
  };

  const softSelectUi = {
    base: "flex min-h-[48px] w-full items-center justify-between gap-3 cursor-pointer rounded-2xl border-0 bg-slate-50 px-4 py-3 text-left text-[14px] text-slate-700 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-teal-400/60",
    value: "truncate",
    placeholder: "truncate text-slate-400",
    trailing: "shrink-0 text-slate-400",
    content: "z-[80] max-h-72 rounded-2xl border border-slate-200 bg-white/98 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl",
    item: "cursor-pointer rounded-xl px-3 py-2 text-[14px] text-slate-700 data-[highlighted]:bg-teal-50 data-[highlighted]:text-slate-900",
  };

  return {
    inputUi,
    softInputUi,
    selectUi,
    softSelectUi,
  };
}
