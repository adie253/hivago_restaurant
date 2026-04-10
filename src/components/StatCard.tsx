interface StatCardProps {
  label: string;
  value: string;
  helpText: string;
}

const StatCard = ({ label, value, helpText }: StatCardProps) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helpText}</p>
    </div>
  );
};

export default StatCard;
