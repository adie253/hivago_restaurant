const LoadingState = () => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500 shadow-sm">
    <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-slate-200"></div>
    <p className="text-sm font-medium">Loading restaurant dashboard...</p>
  </div>
);

export default LoadingState;
