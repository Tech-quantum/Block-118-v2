import { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Wallet, CreditCard, Plus, X, ArrowDownLeft, ArrowUpRight, Banknote } from 'lucide-react';

export default function Finance({ user }: { user: any }) {
  const [units, setUnits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ unit: '', amount: '', type: 'payment', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unitsRes, transRes, expRes] = await Promise.all([
        api.get('/units'),
        api.get('/transactions'),
        api.get('/expenses')
      ]);
      setUnits(unitsRes.data.units);
      setTransactions(transRes.data.transactions);
      setExpenses(expRes.data.expenses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.unit === 'all') {
      if (!window.confirm('آیا از اعمال این تراکنش برای تمام ۴۰ واحد اطمینان دارید؟')) return;
    }
    setSaving(true);
    try {
      await api.post('/transactions', { ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm({ unit: '', amount: '', type: 'payment', description: '' });
      fetchData();
    } catch (err) {
      alert('خطا در ثبت تراکنش');
    } finally {
      setSaving(false);
    }
  };

  const debtors = units.filter(u => u.debt > 0);
  const totalDebt = debtors.reduce((sum, u) => sum + Number(u.debt), 0);

  // محاسبه موجودی صندوق (فقط برای ادمین دقیق است)
  const totalPayments = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const fundBalance = totalPayments - totalExpenses;

  const myUnitDebt = units[0]?.debt || 0;

  if (loading) return <div className="flex justify-center py-10 text-blue-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* موجودی صندوق (فقط برای ادمین) */}
        {user.role === 'admin' && (
          <div className="bg-gradient-to-l from-emerald-600 to-emerald-800 text-white p-6 rounded-3xl shadow-lg flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-lg font-medium opacity-90 mb-1 flex items-center gap-2"><Banknote className="w-5 h-5"/> موجودی فعلی صندوق ساختمان</h2>
              <p className="text-3xl font-bold">
                {fundBalance.toLocaleString('fa-IR')} <span className="text-sm font-normal">تومان</span>
              </p>
            </div>
            <Banknote className="w-24 h-24 absolute -left-4 -bottom-4 opacity-20" />
          </div>
        )}

        {/* وضعیت بدهی/طلب */}
        <div className={`bg-gradient-to-l ${user.role === 'admin' ? 'from-blue-600 to-blue-800' : myUnitDebt > 0 ? 'from-red-600 to-red-800' : myUnitDebt < 0 ? 'from-green-600 to-green-800' : 'from-slate-600 to-slate-800'} text-white p-6 rounded-3xl shadow-lg flex justify-between items-center`}>
          <div>
            <h2 className="text-lg font-medium opacity-90 mb-1">
              {user.role === 'admin' ? 'مجموع بدهی ساختمان' : myUnitDebt > 0 ? 'بدهی واحد من' : myUnitDebt < 0 ? 'طلب واحد من' : 'وضعیت مالی واحد من'}
            </h2>
            <p className="text-3xl font-bold">
              {user.role === 'admin' 
                ? (totalDebt > 0 ? totalDebt.toLocaleString('fa-IR') : '0')
                : (Math.abs(myUnitDebt).toLocaleString('fa-IR'))
              } <span className="text-sm font-normal">تومان</span>
            </p>
          </div>
          {user.role === 'admin' && (
            <button onClick={() => setShowModal(true)} className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-sm">
              <Plus className="w-4 h-4" /> ثبت تراکنش
            </button>
          )}
        </div>
      </div>

      {user.role === 'admin' && debtors.length > 0 && (
        <>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-blue-600" /> لیست بدهکاران</h3>
          <div className="space-y-3 mb-8">
            {debtors.map(unit => (
              <div key={unit.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100">واحد {unit.unitNumber}</p>
                  {unit.owner && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{unit.owner}</p>}
                </div>
                <p className="text-sm font-bold text-red-500">{Number(unit.debt).toLocaleString('fa-IR')} تومان</p>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> تاریخچه تراکنش‌ها</h3>
      {transactions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 p-6 rounded-2xl text-center border border-gray-200 dark:border-gray-700">
          <p>هنوز تراکنشی ثبت نشده است.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${t.type === 'payment' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {t.type === 'payment' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                    {t.type === 'payment' ? 'پرداخت شارژ' : 'صدور شارژ'} {user.role === 'admin' && `(واحد ${t.unit})`}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.description || 'بدون توضیح'}</p>
                </div>
              </div>
              <div className="text-left" dir="ltr">
                <p className={`text-sm font-bold ${t.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'payment' ? '-' : '+'}{Number(t.amount).toLocaleString('fa-IR')}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{new Date(t.createdAt).toLocaleDateString('fa-IR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">ثبت تراکنش جدید</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">شماره واحد</label>
                <select required value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="" disabled>انتخاب کنید...</option>
                  <option value="all" className="font-bold text-blue-600">🌟 همه واحدها (اعمال برای کل ساختمان)</option>
                  <option disabled>──────────</option>
                  {units.map(u => <option key={u.id} value={u.unitNumber}>واحد {u.unitNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">نوع تراکنش</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="payment">ثبت پرداخت (کاهش بدهی)</option>
                  <option value="charge">صدور شارژ (افزایش بدهی)</option>
                </select>
              </div>
              <div><label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">مبلغ (تومان)</label><input type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-left bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" dir="ltr" placeholder="مثلا 200000" /></div>
              <div><label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">توضیحات (اختیاری)</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="مثلا: شارژ آبان ماه" /></div>
              <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-2">{saving ? 'در حال ثبت...' : 'ثبت تراکنش'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
              }
