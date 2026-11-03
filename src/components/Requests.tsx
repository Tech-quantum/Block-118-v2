import { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Plus, Clock, CheckCircle2, Wrench, Trash2, X, Image as ImageIcon } from 'lucide-react';

export default function Requests({ user }: { user: any }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', image: '', thumbnail: '' });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests');
      // ساکنین درخواست‌های حذف شده را نمی‌بینند
      const visibleReqs = res.data.requests.filter((r: any) => 
        user.role === 'admin' ? true : r.status !== 'deleted'
      );
      setRequests(visibleReqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // فشرده‌سازی عکس با استفاده از Canvas (تبدیل عکس ۵ مگابایتی به حدود ۴۰ کیلوبایت)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // ۱. عکس اصلی (حداکثر ابعاد ۸۰۰ پیکسل، کیفیت ۶۰٪)
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800;
        if (width > height && width > max_size) { height *= max_size / width; width = max_size; }
        else if (height > max_size) { width *= max_size / height; height = max_size; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.6);

        // ۲. بندانگشتی (حداکثر ابعاد ۱۵۰ پیکسل، کیفیت ۷۰٪)
        const thumbCanvas = document.createElement('canvas');
        let tWidth = img.width;
        let tHeight = img.height;
        const thumb_size = 150;
        if (tWidth > tHeight && tWidth > thumb_size) { tHeight *= thumb_size / tWidth; tWidth = thumb_size; }
        else if (tHeight > thumb_size) { tWidth *= thumb_size / tHeight; tHeight = thumb_size; }
        thumbCanvas.width = tWidth;
        thumbCanvas.height = tHeight;
        thumbCanvas.getContext('2d')?.drawImage(img, 0, 0, tWidth, tHeight);
        const thumbnailBase64 = thumbCanvas.toDataURL('image/jpeg', 0.7);

        setForm(prev => ({ ...prev, image: imageBase64, thumbnail: thumbnailBase64 }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/requests', form);
      setForm({ title: '', description: '', image: '', thumbnail: '' });
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

  const deleteRequest = async (id: string) => {
    if (!window.confirm('آیا از حذف این درخواست اطمینان دارید؟ (عکس اصلی حذف می‌شود اما بندانگشتی باقی می‌ماند)')) return;
    try {
      await api.delete(`/requests/${id}`);
      fetchRequests();
    } catch (err) {
      alert('خطا در حذف درخواست');
    }
  };

  const statusMap: any = {
    pending: { label: 'در انتظار', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icon: <Clock className="w-4 h-4" /> },
    in_progress: { label: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400', icon: <Wrench className="w-4 h-4" /> },
    done: { label: 'انجام شد', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400', icon: <CheckCircle2 className="w-4 h-4" /> },
    deleted: { label: 'حذف شده', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400', icon: <Trash2 className="w-4 h-4" /> }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {user.role === 'resident' && !showForm && (
        <button onClick={() => setShowForm(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold mb-4 shadow-sm flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> ثبت درخواست جدید
        </button>
      )}

      {showForm && (
        <form onSubmit={submitRequest} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">عنوان مشکل</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="مثلا: خرابی آسانسور" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">توضیحات</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">افزودن تصویر (اختیاری)</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-gray-600 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> انتخاب عکس
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {form.thumbnail && (
                <div className="relative inline-block">
                  <img src={form.thumbnail} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-gray-300 dark:border-gray-600" />
                  <button type="button" onClick={() => setForm({...form, image: '', thumbnail: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-bold disabled:opacity-50 transition-colors">
              {saving ? 'در حال ثبت...' : 'ثبت درخواست'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 rounded-xl font-bold transition-colors">انصراف</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10 text-blue-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-10">درخواستی ثبت نشده است.</p>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 ${r.status === 'deleted' ? 'opacity-70 grayscale' : ''}`}>
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">{r.title}</h3>
                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md whitespace-nowrap ${statusMap[r.status]?.color || statusMap.pending.color}`}>
                  {statusMap[r.status]?.icon} {statusMap[r.status]?.label}
                </span>
              </div>
              {r.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{r.description}</p>}
              
              {/* نمایش عکس اصلی یا بندانگشتی */}
              {(r.image || r.thumbnail) && (
                <div className="mb-3">
                  <img 
                    src={r.image || r.thumbnail} 
                    alt="Request Attachment" 
                    onClick={() => setPreview(r.image || r.thumbnail)}
                    className={`h-24 w-24 object-cover rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity ${!r.image && r.thumbnail ? 'blur-[1px]' : ''}`} 
                  />
                  {!r.image && r.thumbnail && <p className="text-[10px] text-red-500 mt-1">عکس اصلی حذف شده است</p>}
                </div>
              )}

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500">واحد {r.unit}</p>
                
                {user.role === 'admin' && (
                  <div className="flex items-center gap-2">
                    <select value={r.status} onChange={e => changeStatus(r.id, e.target.value)} className="text-xs px-2 py-1 border rounded-lg outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option value="pending">در انتظار</option>
                      <option value="in_progress">در حال بررسی</option>
                      <option value="done">انجام شد</option>
                    </select>
                    {/* دکمه حذف فقط وقتی وضعیت "انجام شد" است */}
                    {r.status === 'done' && (
                      <button onClick={() => deleteRequest(r.id)} className="bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مدال نمایش عکس بزرگ */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]" onClick={() => setPreview(null)}>
          <div className="relative max-w-full max-h-full">
            <img src={preview} alt="Preview" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
            <button onClick={() => setPreview(null)} className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-full p-2 shadow-lg"><X className="w-6 h-6" /></button>
          </div>
        </div>
      )}
    </div>
  );
      }
