import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOwnerOutlets } from '../../api/ownerApi';
import { useAuth } from '../../context/AuthContext';
import { RestaurantMinimal } from '../../types';
import { StatCardSkeleton } from '../../components/Skeletons';

const OwnerOutletsPage = () => {
  const [outlets, setOutlets] = useState<RestaurantMinimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { switchOutlet, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const data = await getOwnerOutlets();
        setOutlets(data);
      } catch (err) {
        setError('Failed to load outlets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  const handleSwitch = async (outletId: string) => {
    try {
      await switchOutlet(outletId);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to switch outlet. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">My Outlets</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome, {user?.name}</h1>
          <p className="text-slate-500 mt-2 font-medium">Select an outlet to manage its operations</p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {outlets.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Outlets Found</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">It seems you don't have any outlets assigned to your account yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {outlets.map((outlet) => (
            <div 
              key={outlet.id} 
              className="group bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner">
                  {outlet.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-600 transition-colors">
                    {outlet.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Code: {outlet.rstCode}
                  </p>
                </div>
              </div>
              
              <div className="mt-auto">
                <button
                  onClick={() => handleSwitch(outlet.id)}
                  className="w-full bg-slate-900 hover:bg-brand-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-slate-200 hover:shadow-brand-200 active:scale-[0.98]"
                >
                  Manage Outlet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerOutletsPage;
