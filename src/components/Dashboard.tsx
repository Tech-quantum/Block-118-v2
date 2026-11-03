import { useState, useEffect } from 'react';
import { api } from '../api';
import { Building2, LogOut, Loader2, X, Edit3, Home, Wrench } from 'lucide-react';
import Requests from './Requests';

export default function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'units' | 'requests'>('units');
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ owner: '', status: 'vacant', debt: 0 });
  const [saving, setSaving] = useState(false);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await api.get('/units');
      setUnits(response.data.units);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUnits(); }, []);

  const openUnit = (unit: any) => {
    setSelectedUnit(unit);
    setEditForm({ owner: unit.owner || '', status: unit.status || 'vacant', debt: unit.debt || 0 });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/units/${selectedUnit.id}`, editForm);
      setSelectedUnit(null);
      fetchUnits();
    } catch (error) { alert("خطا در ذخیره"); } 
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center rounded-b-2xl">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Block-118</h1>
          <p className="text-xs text-blue-200 mt-1">{user.name} خوش آمدید</p>
        </div>
        <button onClick={onLogout} className="bg-blue-700 hover:bg-red-500 transition-colors px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2"><LogOut className="w-4 h-4" /> خروج</button>
      </header>

      <main className="p-4 max-w-3xl mx-auto">
        {activeTab === 'units' ? (
          <>
            {user.role === 'admin' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Building2 className="w-6 h-6" /></div>
                  <div><p className="text-gray-500 text-sm">کل واحدها</p><p className="text-xl font-bold text-gray-800">{units.length}</p></div>
                </div>
              </div>
            )}
            <h2 className="text-lg font-bold text-gray-800 mb-4">{user.role === 'admin' ? 'لیست واحدها' : 'واحد من'}</h2>
            {loading ? (
              <div className="flex justify-center py-10 text-blue-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {units.map((unit) => (
                  <div key={unit.id} onClick={() => user.role === 'admin' && openUnit(unit)} className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-200 transition-shadow ${user.role === 'admin' ? 'cursor-pointer hover:shadow-md' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-800">واحد {unit.unitNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-md ${unit.status === 'vacant' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>{unit.status === 'vacant' ? 'خالی' : 'ساکن دارد'}</span>
                    </div>
                    <p className="text-xs text-gray-400">طبقه {unit.floor}</p>
                    {unit.owner && <p className="text-xs text-gray-600 mt-1">مالک: {unit.owner}</p>}
                    {unit.debt > 0 && <p className="text-xs text-red-500 mt-2 font-bold">بدهی: {unit.debt.toLocaleString('fa-IR')} تومان</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <Requests user={user} />
        )}
      </main>

      {/* منوی پایین */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('units')} className={`flex flex-col items-center p-2 ${activeTab === 'units' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Home className="w-6 h-6" /><span className="text-xs mt-1 font-medium">داشبورد</span>
        </button>
        <button onClick={() => setActiveTab('requests')} className={`flex flex-col items-center p-2 ${activeTab === 'requests' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Wrench className="w-6 h-6" /><span className="text-xs mt-1 font-medium">درخواست‌ها</span>
        </button>
      </nav>

      {/* مدال ویرایش */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !saving && setSelectedUnit(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Edit3 className="w-5 h-5 text-blue-600" /> ویرایش واحد {selectedUnit.unitNumber}</h3>
              <button onClick={() => setSelectedUnit(null)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-600 mb-1">نام مالک</label><input type="text" value={editForm.owner} onChange={e => setEditForm({...editForm, owner: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="خالی بگذارید اگر ساکن ندارد" /></div>
              <div><label className="block text-sm text-gray-600 mb-1">وضعیت واحد</label><select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none bg-white"><option value="vacant">خالی</option><option value="occupied">ساکن دارد</option></select></div>
              <div><label className="block text-sm text-gray-600 mb-1">بدهی (تومان)</label><input type="number" value={editForm.debt} onChange={e => setEditForm({...editForm, debt: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-left" dir="ltr" /></div>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
