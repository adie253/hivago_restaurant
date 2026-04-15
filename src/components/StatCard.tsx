interface StatCardProps {
  label: string;
  value: string;
  helpText?: string;
  icon?: string;
}

const StatCard = ({ label, value, icon }: StatCardProps) => {
  return (
    <div className="flex items-center justify-between rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
          <img src={icon} alt="" className="h-7 w-7 opacity-80" />
        </div>
      )}
    </div>
  );
};


export default StatCard;
