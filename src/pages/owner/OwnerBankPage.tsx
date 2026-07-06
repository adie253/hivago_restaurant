import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { getOwnerProfile, updateOwnerBankDetails } from '../../api/ownerApi';
import BankDetailsModal from '../../components/BankDetailsModal';

const OwnerBankPage = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<{
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  const fetchBankDetails = async () => {
    setLoading(true);
    try {
      const data = await getOwnerProfile();
      setProfile({
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        bankIfscCode: data.bankIfscCode
      });
    } catch (err) {
      console.error('Failed to load owner profile details:', err);
      showToast('Failed to load bank details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const handleSaveBankDetails = async (data: {
    bankAccountName: string;
    bankAccountNumber: string;
    bankIfscCode: string;
  }) => {
    await updateOwnerBankDetails(data);
    showToast('Bank details updated successfully', 'success');
    fetchBankDetails();
  };

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bank Details</h1>
        <p className="text-slate-400 font-semibold text-sm">Manage your settlement bank account details below.</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Settlement Bank Account</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">This account is used for all settlements across your outlets.</p>
            </div>
            <button
              onClick={() => setBankModalOpen(true)}
              disabled={loading}
              className="rounded-2xl bg-slate-900 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-emerald-600 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-slate-100 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Update Details
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : profile && profile.bankAccountNumber ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Account Holder Name</p>
                <p className="text-base font-bold text-slate-900">{profile.bankAccountName || '-'}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">IFSC Code</p>
                <p className="text-base font-bold text-slate-900 tracking-wider">{profile.bankIfscCode || '-'}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 sm:col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Bank Account Number</p>
                  <p className="text-lg font-mono font-bold text-slate-900">
                    {profile.bankAccountNumber 
                      ? `•••• •••• •••• ${profile.bankAccountNumber.slice(-4)}` 
                      : '-'
                    }
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm border border-emerald-100/50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 border border-amber-100/50">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-800">No Bank Details Configured</h4>
              <p className="text-xs font-semibold text-slate-400 mt-1 max-w-[280px]">Please update your bank details to receive settlements.</p>
            </div>
          )}
        </div>
      </div>

      <BankDetailsModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        initialData={profile || undefined}
        onSave={handleSaveBankDetails}
      />
    </div>
  );
};

export default OwnerBankPage;
