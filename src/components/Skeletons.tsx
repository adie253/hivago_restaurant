import React from 'react';

export const StatCardSkeleton = () => (
  <div className="flex items-center justify-between rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex-1 animate-pulse space-y-3">
      <div className="h-4 w-24 rounded bg-slate-100"></div>
      <div className="h-8 w-16 rounded bg-slate-100"></div>
    </div>
    <div className="flex h-14 w-14 shrink-0 animate-pulse items-center justify-center rounded-2xl bg-slate-50"></div>
  </div>
);

export const OrderCardSkeleton = () => (
  <article className="overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
    <div className="grid lg:grid-cols-[1.6fr_1fr]">
      {/* Left Column */}
      <div className="animate-pulse p-8 lg:p-10">
        <header className="flex gap-4">
          <div className="h-8 w-32 rounded-xl bg-slate-100"></div>
          <div className="h-8 w-24 rounded-xl bg-slate-100"></div>
          <div className="h-8 w-28 rounded-xl bg-slate-100"></div>
        </header>

        <div className="mt-8">
          <div className="h-8 w-40 rounded bg-slate-100"></div>
          <div className="mt-2 h-4 w-64 rounded bg-slate-100"></div>
        </div>

        <div className="mt-8 flex gap-3">
          <div className="h-8 w-16 rounded-xl bg-slate-100"></div>
          <div className="h-8 w-16 rounded-xl bg-slate-100"></div>
          <div className="h-8 w-16 rounded-xl bg-slate-100"></div>
        </div>

        <div className="mt-10 space-y-5">
          <div className="h-3 w-20 rounded bg-slate-100"></div>
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between border-b border-slate-50 pb-3">
              <div className="h-5 w-48 rounded bg-slate-100"></div>
              <div className="h-5 w-16 rounded bg-slate-100"></div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-100 pt-10">
          <div className="h-6 w-48 rounded bg-slate-100"></div>
          <div className="mt-2 h-4 w-32 rounded bg-slate-100"></div>
          <div className="mt-6 h-3 w-40 rounded bg-slate-100"></div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex animate-pulse flex-col border-l border-slate-50 bg-[#FBFBFC] p-8 lg:p-10">
        <div className="flex-1 space-y-6">
          <div className="h-32 rounded-[32px] bg-slate-100"></div>
          <div className="h-24 rounded-3xl bg-slate-100"></div>

          <div className="flex items-center justify-between">
            <div className="h-5 w-20 rounded bg-slate-100"></div>
            <div className="h-8 w-24 rounded bg-slate-100"></div>
          </div>

          <div className="h-16 rounded-[20px] bg-slate-100"></div>
        </div>
        <div className="mt-8 flex gap-3">
          <div className="h-12 flex-1 rounded-2xl bg-slate-100"></div>
          <div className="h-12 flex-1 rounded-2xl bg-slate-100"></div>
        </div>
      </div>
    </div>
  </article>
);

export const SettingsPageSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-10 w-48 rounded bg-slate-100"></div>
    <div className="flex gap-2">
      <div className="h-10 w-24 rounded-xl bg-slate-100"></div>
      <div className="h-10 w-24 rounded-xl bg-slate-100"></div>
      <div className="h-10 w-24 rounded-xl bg-slate-100"></div>
    </div>
    <div className="rounded-[32px] bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
      <div className="space-y-10">
        <div className="h-8 w-64 rounded bg-slate-100"></div>
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="space-y-2.5">
              <div className="h-4 w-32 rounded bg-slate-100"></div>
              <div className="h-14 w-full rounded-2xl bg-slate-100"></div>
            </div>
          ))}
        </div>
        <div className="h-16 w-full rounded-[24px] bg-slate-100"></div>
      </div>
    </div>
  </div>
);

export const MenuPageSkeleton = () => (
  <div className="grid gap-10 lg:grid-cols-[280px_1fr] animate-pulse">
    <aside className="hidden lg:block space-y-4">
      <div className="h-8 w-32 rounded bg-slate-100 mb-6"></div>
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-12 w-full rounded-xl bg-slate-100"></div>
      ))}
    </aside>
    <div className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-10 w-64 rounded bg-slate-100"></div>
          <div className="h-4 w-32 rounded bg-slate-100"></div>
        </div>
        <div className="h-12 w-40 rounded-2xl bg-slate-100"></div>
      </div>
      <div className="h-16 w-full rounded-[24px] bg-slate-100"></div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-80 w-full rounded-[32px] border border-slate-100 bg-white shadow-sm">
            <div className="h-40 w-full bg-slate-100 rounded-t-[32px]"></div>
            <div className="p-6 space-y-4">
               <div className="h-6 w-3/4 rounded bg-slate-200"></div>
               <div className="h-4 w-1/2 rounded bg-slate-200"></div>
               <div className="h-10 w-full rounded-xl bg-slate-200 mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const PayoutsPageSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
         <div className="h-10 w-32 rounded bg-slate-100"></div>
         <div className="h-4 w-48 rounded bg-slate-100"></div>
      </div>
      <div className="h-12 w-48 rounded-2xl bg-slate-100"></div>
    </div>

    <div className="space-y-4">
      <div className="h-6 w-32 rounded bg-slate-100"></div>
      <div className="h-40 rounded-[32px] bg-white border border-slate-50 p-10 flex gap-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex-1 space-y-3"><div className="h-4 w-20 bg-slate-100 rounded"></div><div className="h-8 w-32 bg-slate-100 rounded"></div></div>
        <div className="flex-1 space-y-3"><div className="h-4 w-20 bg-slate-100 rounded"></div><div className="h-8 w-32 bg-slate-100 rounded"></div></div>
        <div className="flex-1 space-y-3"><div className="h-4 w-20 bg-slate-100 rounded"></div><div className="h-8 w-24 bg-slate-100 rounded"></div></div>
        <div className="flex-1 space-y-3 items-end flex flex-col"><div className="h-4 w-32 bg-slate-100 rounded"></div><div className="h-8 w-40 bg-slate-100 rounded"></div></div>
      </div>
    </div>

    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div className="h-6 w-32 rounded bg-slate-100"></div>
         <div className="h-10 w-48 rounded-2xl bg-slate-100"></div>
      </div>
      <div className="h-[400px] rounded-[32px] bg-white border border-slate-50 p-8 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
         <div className="h-10 bg-slate-50/50 rounded-xl"></div>
         {[1,2,3,4].map(i => (
            <div key={i} className="h-12 bg-white border-b border-slate-50 flex items-center justify-between px-8">
               <div className="h-4 w-24 bg-slate-100 rounded"></div>
               <div className="h-4 w-24 bg-slate-100 rounded"></div>
               <div className="h-6 w-20 bg-slate-100 rounded-full"></div>
            </div>
         ))}
      </div>
    </div>
  </div>
);
