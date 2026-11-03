import { useState, useEffect } from 'react';
import { api, changePassword } from '../api';
import { Building2, LogOut, Loader2, X, Edit3, Home, Wrench, Wallet, MessageCircle, User, Key, Megaphone } from 'lucide-react';
import Requests from './Requests';
import Finance from './Finance';
import Messages from './Messages';

export default function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'units' | 'requests' | 'finance' | 'messages'>('units');
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State های اطلاعیه
  const [announcement, setAnnouncement] = useState<any>(null);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annText, setAnnText] = useState('');
  const [annSaving, setAnnSaving] = useState(false);

  // State های مدال ویرایش واحد
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ owner: '', status: 'vacant', debt: 0 });
  const [saving, setSaving] = useState(false);

  // State های مدال تغییر رمز
  const [showProfile, setShowProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unitsRes, annRes] = await Promise.all([
        api.get('/units'),
        api.get('/announcements')
      ]);
      setUnits(unitsRes.data.units);
      if (annRes.data.announcements && annRes.data.announcements.length > 0) {
        setAnnouncement(annRes.data.announcements[0]); // نمایش آخرین اطلاعیه
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveAnnouncement = async () => {
    setAnnSaving(true);
    try {
      await api.post('/announcements', { text: annText, id: announcement?.id });
      setShowAnnModal(false);
      fetchData();
    } catch (err) { alert('خطا در ثبت اطلاعیه'); } 
    finally { setAnnSaving(false); }
  };

  const deleteAnnouncement = async () => {
    if (!window.confirm('آیا از حذف این اطلاعیه اطمینان دارید؟')) return;
    try {
      await api.delete(`/announcements?id=${announcement.id}`);
      setAnnouncement(null);
    } catch (err) { alert('خطا در حذف اطلاعیه'); }
  };

  const openUnit = (unit: any) => {
    setSelectedUnit(unit);
    setEditForm({ owner: unit.owner || '', status: unit.status || 'vacant', debt: unit.debt || 0 });
  };

  const handleSaveUnit = async () => {
    setSaving(true);
    try {
      await api.patch(`/units/${selectedUnit.id}`, editForm);
      setSelectedUnit(null);
      fetchData();
    } catch (error) { alert("خطا در ذخیره"); } 
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMessage({ type: '', text: '' });
    try {
      const res = await changePassword(newPassword);
      localStorage.setItem('token', res.newToken);
      setPassMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر کرد.' });
      setNewPassword('');
      setTimeout(() => setShowProfile(false), 2000);
    } catch (err: any) {
      setPassMessage({ type: 'error', text: err.response?.data?.error || 'خطا در تغییر رمز' });
    } finally { setPassLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center rounded-b-2xl">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Block-118</h1>
          <p className="text-xs text-blue-200 mt-1">{user.name} خوش آمدید</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowProfile(true)} className="bg-blue-700 hover:bg-blue-800 transition-colors p-2 rounded-xl text-sm font-medium">
            <User className="w-5 h-5" />
          </button>
          <button onClick={onLogout} className="bg-blue-700 hover:bg-red-500 transition-colors px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>
      </header>

      {/* بنر اطلاعیه */}
      {(announcement || user.role === 'admin') && (
        <div className="max-w-3xl mx-auto px-4 mt-4">
          {announcement ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm relative group">
              <Megaphone className="w-6 h-6 text-yellow-600 mt-1 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 font-medium leading-relaxed whitespace-pre-wrap">{announcement.text}</p>
                <p className="text-[10px] text-yellow-600 mt-2">{new Date(announcement.createdAt).toLocaleString('fa-IR')}</p>
              </div>
              {user.role === 'admin' && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setAnnText(announcement.text); setShowAnnModal(true); }} className="text-yellow-600 hover:text-yellow-800 p-1"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={deleteAnnouncement} className="text-yellow-600 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ) : (
            user.role === 'admin' && (
              <button onClick={() => { setAnnText(''); setShowAnnModal(true); }} className="w-full bg-yellow-50 border border-yellow-200 border-dashed text-yellow-700 py-3 rounded-2xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-yellow-100 transition-colors">
                <Megaphone className="w-5 h-5" /> ثبت اطلاعیه جدید برای ساختمان
              </button>
            )
          )}
        </div>
      )}

      <main className="p-4 max-w-3xl mx-auto mt-2">
        {activeTab === 'units' && (
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
                    {unit.debt > 0 && <p className="text-xs text-red-500 mt-2 font-bold">بدهی: {Number(unit.debt).toLocaleString('fa-IR')} تومان</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'requests' && <Requests user={user} />}
        {activeTab === 'finance' && <Finance user={user} />}
        {activeTab === 'messages' && <Messages user={user} />}
      </main>

      {/* منوی پایین */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('units')} className={`flex flex-col items-center p-2 ${activeTab === 'units' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Home className="w-6 h-6" /><span className="text-[10px] mt-1 font-medium">داشبورد</span>
        </button>
        <button onClick={() => setActiveTab('messages')} className={`flex flex-col items-center p-2 ${activeTab === 'messages' ? 'text-blue-600' : 'text-gray-400'}`}>
          <MessageCircle className="w-6 h-6" /><span className="text-[10px] mt-1 font-medium">پیام‌ها</span>
        </button>
        <button onClick={() => setActiveTab('requests')} className={`flex flex-col items-center p-2 ${activeTab === 'requests' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Wrench className="w-6 h-6" /><span className="text-[10px] mt-1 font-medium">درخواست‌ها</span>
        </button>
        <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center p-2 ${activeTab === 'finance' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Wallet className="w-6 h-6" /><span className="text-[10px] mt-1 font-medium">شارژها</span>
        </button>
      </nav>

      {/* مدال ویرایش واحد */}
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
            <button onClick={handleSaveUnit} disabled={saving} className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</button>
          </div>
        </div>
      )}

      {/* مدال تغییر رمز */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !passLoading && setShowProfile(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Key className="w-5 h-5 text-blue-600" /> تنظیمات حساب</h3>
              <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">رمز عبور جدید</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-left" dir="ltr" placeholder="حداقل ۶ کاراکتر" required />
              </div>
              {passMessage.text && <p className={`text-sm text-center p-2 rounded-lg ${passMessage.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{passMessage.text}</p>}
              <button type="submit" disabled={passLoading || newPassword.length < 6} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors">{passLoading ? 'در حال تغییر...' : 'تغییر رمز عبور'}</button>
            </form>
          </div>
        </div>
      )}

      {/* مدال نوشتن اطلاعیه */}
      {showAnnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !annSaving && setShowAnnModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Megaphone className="w-5 h-5 text-yellow-600" /> ثبت اطلاعیه</h3>
              <button onClick={() => setShowAnnModal(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            <textarea value={annText} onChange={e => setAnnText(e.target.value)} rows={4} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 mb-4" placeholder="متن اطلاعیه (مثلا: قطعی آب فردا از ساعت ۹ تا ۱۲)"></textarea>
            <button onClick={handleSaveAnnouncement} disabled={annSaving || !annText.trim()} className="w-full bg-yellow-500 text-white font-bold py-3 rounded-xl disabled:opacity-50">{annSaving ? 'در حال ثبت...' : 'انتشار اطلاعیه'}</button>
          </div>
        </div>
      )}
    </div>
  );
                                                                                                                 }
