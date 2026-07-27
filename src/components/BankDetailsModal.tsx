import React, { useState, useEffect } from 'react';

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
  };
  onSave: (data: {
    bankAccountName: string;
    bankAccountNumber: string;
    bankIfscCode: string;
  }) => Promise<void>;
  title?: string;
}

const BankDetailsModal = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  title = 'Bank Account Details'
}: BankDetailsModalProps) => {
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showConfirmAccountNumber, setShowConfirmAccountNumber] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAccountName(initialData?.bankAccountName || '');
      setAccountNumber(initialData?.bankAccountNumber || '');
      setConfirmAccountNumber(initialData?.bankAccountNumber || '');
      setIfscCode(initialData?.bankIfscCode || '');
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validateIFSC = (ifsc: string) => {
    // Indian IFSC format: 4 alphabetic chars, 0, then 6 alphanumeric chars
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanAccountName = accountName.trim();
    const cleanAccountNumber = accountNumber.trim();
    const cleanConfirmAccountNumber = confirmAccountNumber.trim();
    const cleanIfsc = ifscCode.trim().toUpperCase();

    if (!cleanAccountName || !cleanAccountNumber || !cleanIfsc) {
      setError('All fields are required.');
      return;
    }

    if (cleanAccountNumber !== cleanConfirmAccountNumber) {
      setError('Account numbers do not match.');
      return;
    }

    if (cleanAccountNumber.length < 9 || cleanAccountNumber.length > 18) {
      setError('Account number should be between 9 and 18 digits.');
      return;
    }

    if (!validateIFSC(cleanIfsc)) {
      setError('Invalid IFSC format. (Example: SBIN0001234)');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        bankAccountName: cleanAccountName,
        bankAccountNumber: cleanAccountNumber,
        bankIfscCode: cleanIfsc
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to save bank details', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to update bank details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-[500px] shadow-2xl border border-slate-50 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-5 flex items-center justify-between border-b border-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Settlement Destination</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full p-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="px-8 py-6 space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            {/* Account Holder Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Holder Name</label>
              <input
                required
                type="text"
                placeholder="e.g. John Doe"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300 focus:bg-white transition-all shadow-sm"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Number</label>
              <div className="relative">
                <input
                  required
                  type={showAccountNumber ? 'text' : 'password'}
                  placeholder="Enter Bank Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300 focus:bg-white transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowAccountNumber(!showAccountNumber)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showAccountNumber ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Account Number */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm Account Number</label>
              <div className="relative">
                <input
                  required
                  type={showConfirmAccountNumber ? 'text' : 'password'}
                  placeholder="Re-enter Bank Account Number"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300 focus:bg-white transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmAccountNumber(!showConfirmAccountNumber)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmAccountNumber ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* IFSC Code */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">IFSC Code</label>
              <input
                required
                type="text"
                maxLength={11}
                placeholder="e.g. SBIN0001234"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-300 focus:bg-white transition-all shadow-sm tracking-wider uppercase placeholder:normal-case"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold text-slate-600 transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-sm font-bold text-white shadow-lg shadow-brand-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                'Save Details'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankDetailsModal;
