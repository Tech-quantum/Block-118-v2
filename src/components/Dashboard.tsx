import { useState, useEffect } from 'react';
import { api } from '../api';
import { Building2, LogOut, Loader2 } from 'lucide-react';

export default function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await api.get('/units');
        setUnits(response.data.units);
      } catch (error) {
        console.error("خطا در دریافت اطلاعات", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUnits();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* هدر */}
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center rounded-b-2xl">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Block-118
          </h1>
          <p className="text-xs text-blue-200 mt-1">{user.name} خوش آمدید</p>
        </div>
        <button
          onClick={onLogout}
          className="bg-blue-700 hover:bg-red-500 transition-colors px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          خروج
        </button>
      </header>

      {/* محتوای اصلی */}
      <main className="p-4 max-w-3xl mx-auto">
        {user.role === 'admin' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">کل واحدها</p>
                <p className="text-xl font-bold text-gray-800">{units.length}</p>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {user.role === 'admin' ? 'لیست واحدها' : 'واحد من'}
        </h2>

        {loading ? (
          <div className="flex justify-center py-10 text-blue-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {units.map((unit) => (
              <div key={unit.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-800">واحد {unit.unitNumber}</span>
                  <span className={`text-xs px-2 py-1 rounded-md ${unit.status === 'vacant' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {unit.status === 'vacant' ? 'خالی' : 'ساکن دارد'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">طبقه {unit.floor}</p>
                {unit.debt > 0 && (
                  <p className="text-xs text-red-500 mt-2 font-bold">بدهی: {unit.debt.toLocaleString('fa-IR')} تومان</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
