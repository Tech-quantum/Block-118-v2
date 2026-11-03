import { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Wallet, CreditCard, AlertCircle } from 'lucide-react';

export default function Finance() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const res = await api.get('/units');
        setUnits(res.data.units);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  const debtors = units.filter(u => u.debt > 0);
  const totalDebt = debtors.reduce((sum, u) => sum + Number(u.debt), 0);

  if (loading) return <div className="flex justify-center py-10 text-blue-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-l from-blue-600 to-blue-800 text-white p-6 rounded-3xl shadow-lg mb-6">
        <h2 className="text-lg font-medium opacity-90 mb-1">وضعیت مالی ساختمان</h2>
        <p className="text-3xl font-bold">{totalDebt > 0 ? totalDebt.toLocaleString('fa-IR') : '0'} <span className="text-sm font-normal">تومان</span></p>
        <p className="text-sm mt-2 opacity-80">{debtors.length} واحد بدهکار</p>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-blue-600" /> لیست بدهکاران
      </h3>

      {debtors.length === 0 ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 border border-green-200">
          <AlertCircle className="w-6 h-6" />
          <p className="font-medium">هیچ واحدی بدهی ندارد.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debtors.map(unit => (
            <div key={unit.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">واحد {unit.unitNumber}</p>
                {unit.owner && <p className="text-xs text-gray-500 mt-1">{unit.owner}</p>}
                <p className="text-sm font-bold text-red-500 mt-2">{Number(unit.debt).toLocaleString('fa-IR')} تومان</p>
              </div>
              <button disabled className="bg-blue-50 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-not-allowed">
                <CreditCard className="w-4 h-4" /> پرداخت
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
