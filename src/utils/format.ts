export const formatCurrency = (value: number | undefined | null) => {
  const safeValue = value ?? 0;
  const formattedValue = safeValue.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(safeValue) ? 0 : 2
  });
  return `₹${formattedValue}`;
};

export const formatRelativeTime = (dateString: string | undefined | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
