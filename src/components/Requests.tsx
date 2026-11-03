import { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Plus, Clock, CheckCircle2, Wrench } from 'lucide-react';

export default function Requests({ user }: { user: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests');
      setRequests(res.data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/requests', form);
      setForm({ title: '', description: '' });
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      alert('خطا در ثبت درخواست');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/requests/${id}`, { status: newStatus });
      fetchRequests();
    } catch (err) {
      alert('خطا در تغییر وضعیت');
    }
  };

  const statusMap: any = {
    pending: { label: 'در انتظار', color: 'bg-gray-100 text-gray-600', icon: <Clock className="w-4 h-4" /> },
    in_progress: { label: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-700', icon: <Wrench className="w-4 h-4" /> },
    done: { label: 'انجام شد', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-4 h-4" /> }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {user.role === 'resident' && !showForm && (
        <button onClick={() => setShowForm(true)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mb-4 shadow-sm flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> ثبت درخواست جدید
        </button>
      )}

      {showForm && (
        <form onSubmit={submitRequest} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">عنوان مشکل</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="مثلا: خرابی آسانسور" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">توضیحات</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold disabled:opacity-50">
              {saving ? 'در حال ثبت...' : 'ثبت'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl font-bold">انصراف</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10 text-blue-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-500 py-10">درخواستی ثبت نشده است.</p>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-bold text-gray-800">{r.title}</h3>
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md whitespace-nowrap ${statusMap[r.status]?.color || statusMap.pending.color}`}>
                  {statusMap[r.status]?.icon} {statusMap[r.status]?.label}
                </span>
              </div>
              {r.description && <p className="text-sm text-gray-600 mb-3">{r.description}</p>}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">واحد {r.unit}</p>
                {user.role === 'admin' && (
                  <select value={r.status} onChange={e => changeStatus(r.id, e.target.value)} className="text-xs px-2 py-1 border rounded-lg outline-none bg-gray-50">
                    <option value="pending">در انتظار</option>
                    <option value="in_progress">در حال بررسی</option>
                    <option value="done">انجام شد</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
