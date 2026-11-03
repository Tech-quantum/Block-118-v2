import { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Wallet, CreditCard, AlertCircle, Plus, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function Finance({ user }: { user: any }) {
  const [units, setUnits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State برای مدال ثبت تراکنش
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ unit: '', amount: '', type: 'payment', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unitsRes, transRes] = await Promise.all([
        api.get('/units'),
        api.get('/transactions')
      ]);
      setUnits(unitsRes.data.units);
      setTransactions(transRes.data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/transactions', { ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm({ unit: '', amount: '', type: 'payment', description: '' });
      fetchData(); // رفرش اطلاعات
    } catch (err) {
      alert('خطا در ثبت تراکنش');
    } finally {
      setSaving(false);
    }
  };

  const debtors = units.filter(u => u.debt > 0);
  const totalDebt = debtors.reduce((sum, u) => sum + Number(u.debt), 0);

  if (loading) return <div className="flex justify-center py-10 text-blue-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      {/* کارت بالای صفحه */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-800 text-white p-6 rounded-3xl shadow-lg mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium opacity-90 mb-1">{user.role === 'admin' ? 'مجموع بدهی ساختمان' : 'بدهی واحد من'}</h2>
          <p className="text-3xl font-bold">
            {user.role === 'admin' 
              ? (totalDebt > 0 ? totalDebt.toLocaleString('fa-IR') : '0')
              : (units[0]?.debt > 0 ? Number(units[0].debt).toLocaleString('fa-IR') : '0')
            } <span className="text-sm font-normal">تومان</span>
          </p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-sm">
            <Plus className="w-4 h-4" /> ثبت تراکنش
          </button>
        )}
      </div>

      {/* لیست بدهکاران (فقط برای ادمین) */}
      {user.role === 'admin' && debtors.length > 0 && (
        <>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-blue-600" /> لیست بدهکاران</h3>
          <div className="space-y-3 mb-8">
            {debtors.map(unit => (
              <div key={unit.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">واحد {unit.unitNumber}</p>
                  {unit.owner && <p className="text-xs text-gray-500 mt-1">{unit.owner}</p>}
                </div>
                <p className="text-sm font-bold text-red-500">{Number(unit.debt).toLocaleString('fa-IR')} تومان</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* تاریخچه تراکنش‌ها */}
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> تاریخچه تراکنش‌ها</h3>
      {transactions.length === 0 ? (
        <div className="bg-gray-50 text-gray-500 p-6 rounded-2xl text-center border border-gray-200">
          <p>هنوز تراکنشی ثبت نشده است.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${t.type === 'payment' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {t.type === 'payment' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">
                    {t.type === 'payment' ? 'پرداخت شارژ' : 'صدور شارژ'} {user.role === 'admin' && `(واحد ${t.unit})`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{t.description || 'بدون توضیح'}</p>
                </div>
              </div>
              <div className="text-left" dir="ltr">
                <p className={`text-sm font-bold ${t.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'payment' ? '-' : '+'}{Number(t.amount).toLocaleString('fa-IR')}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(t.createdAt).toLocaleDateString('fa-IR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مدال ثبت تراکنش (فقط ادمین) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">ثبت تراکنش جدید</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">شماره واحد</label>
                <select required value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none bg-white">
                  <option value="" disabled>انتخاب کنید...</option>
                  {units.map(u => <option key={u.id} value={u.unitNumber}>واحد {u.unitNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">نوع تراکنش</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none bg-white">
                  <option value="payment">ثبت پرداخت (کاهش بدهی)</option>
                  <option value="charge">صدور شارژ (افزایش بدهی)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">مبلغ (تومان)</label>
                <input type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-left" dir="ltr" placeholder="مثلا 200000" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">توضیحات (اختیاری)</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="مثلا: شارژ آبان ماه" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-2">
                {saving ? 'در حال ثبت...' : 'ثبت تراکنش'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
