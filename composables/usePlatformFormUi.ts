export function usePlatformFormUi() {
  const inputUi = {
    root: "w-full",
    base: "w-full min-h-[52px] cursor-text rounded-[22px] border-0 bg-white/92 px-4 py-3.5 text-[14px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-slate-200/90 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-400/60",
  };

  const softInputUi = {
    root: "w-full",
    base: "w-full min-h-[52px] cursor-text rounded-[22px] border-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.92))] px-4 py-3.5 text-[14px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] ring-1 ring-slate-200/90 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-400/60",
  };

  const selectUi = {
    base: "flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-3 rounded-[22px] border-0 bg-white/92 px-4 py-3.5 text-left text-[14px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-slate-200/90 outline-none transition focus:bg-white focus:ring-2 focus:ring-teal-400/60",
    value: "truncate",
    placeholder: "truncate text-slate-400",
    trailing: "shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180",
    content: "z-[80] max-h-72 rounded-[24px] border border-slate-200/90 bg-white/98 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl",
    item: "cursor-pointer rounded-2xl px-3 py-2.5 text-[14px] text-slate-700 data-[highlighted]:bg-teal-50 data-[highlighted]:text-slate-900 data-[state=checked]:bg-slate-900 data-[state=checked]:text-white",
  };

  const softSelectUi = {
    base: "flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-3 rounded-[22px] border-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.92))] px-4 py-3.5 text-left text-[14px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] ring-1 ring-slate-200/90 outline-none transition focus:bg-white focus:ring-2 focus:ring-teal-400/60",
    value: "truncate",
    placeholder: "truncate text-slate-400",
    trailing: "shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180",
    content: "z-[80] max-h-72 rounded-[24px] border border-slate-200/90 bg-white/98 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl",
    item: "cursor-pointer rounded-2xl px-3 py-2.5 text-[14px] text-slate-700 data-[highlighted]:bg-teal-50 data-[highlighted]:text-slate-900 data-[state=checked]:bg-slate-900 data-[state=checked]:text-white",
  };

  return {
    inputUi,
    softInputUi,
    selectUi,
    softSelectUi,
  };
}
