import { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Plus, X, Trash2, Edit3, Receipt } from 'lucide-react';

export default function Expenses({ user }: { user: any }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: '', title: '', amount: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data.expenses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await api.patch(`/expenses?id=${form.id}`, { title: form.title, amount: Number(form.amount), description: form.description });
      } else {
        await api.post('/expenses', { title: form.title, amount: Number(form.amount), description: form.description });
      }
      setShowModal(false);
      setForm({ id: '', title: '', amount: '', description: '' });
      fetchExpenses();
    } catch (err) {
      alert('خطا در ثبت هزینه');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!window.confirm('آیا از حذف این هزینه اطمینان دارید؟')) return;
    try {
      await api.delete(`/expenses?id=${id}`);
      fetchExpenses();
    } catch (err) {
      alert('خطا در حذف هزینه');
    }
  };

  const openEdit = (exp: any) => {
    setForm({ id: exp.id, title: exp.title, amount: String(exp.amount), description: exp.description });
    setShowModal(true);
  };

  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-rose-500" /> هزینه‌های ساختمان
        </h2>
        {user.role === 'admin' && (
          <button onClick={() => { setForm({ id: '', title: '', amount: '', description: '' }); setShowModal(true); }} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors">
            <Plus className="w-4 h-4" /> ثبت هزینه
          </button>
        )}
      </div>

      {user.role === 'admin' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">مجموع هزینه‌های ثبت‌شده</p>
          <p className="text-2xl font-bold text-rose-500 mt-1">{totalExpenses.toLocaleString('fa-IR')} تومان</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10 text-rose-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : expenses.length === 0 ? (
        <p className="text-center text-gray-500 py-10">هزینه‌ای ثبت نشده است.</p>
      ) : (
        <div className="space-y-3">
          {expenses.map(exp => (
            <div key={exp.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              
              <div className="p-4 flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{exp.title}</p>
                  {exp.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{exp.description}</p>}
                  <p className="text-[10px] text-gray-400 mt-2">{new Date(exp.createdAt).toLocaleDateString('fa-IR')}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-rose-500">{Number(exp.amount).toLocaleString('fa-IR')} تومان</p>
                </div>
              </div>

              {/* 👈 نوار پایین کارت برای دکمه‌ها (کاملاً واضح) */}
              {user.role === 'admin' && (
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                  <button onClick={() => openEdit(exp)} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    <Edit3 className="w-3.5 h-3.5" /> ویرایش
                  </button>
                  <button onClick={() => deleteExpense(exp.id)} className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium hover:underline">
                    <Trash2 className="w-3.5 h-3.5" /> حذف
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{form.id ? 'ویرایش هزینه' : 'ثبت هزینه جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">عنوان هزینه</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-rose-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="مثلا: تعمیر آسانسور" /></div>
              <div><label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">مبلغ (تومان)</label><input type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-left bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" dir="ltr" placeholder="مثلا: 500000" /></div>
              <div><label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">توضیحات (اختیاری)</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-rose-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <button type="submit" disabled={saving} className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-2">{saving ? 'در حال ثبت...' : 'ثبت هزینه'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
