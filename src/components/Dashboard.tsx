import { useState, useEffect } from 'react';
import { api, changePassword } from '../api';
import { Building2, LogOut, Loader2, X, Edit3, Home, Wrench, Wallet, MessageCircle, User, Key, Megaphone, Download, Settings, Sun, Moon, HelpCircle } from 'lucide-react';
import Requests from './Requests';
import Finance from './Finance';
import Messages from './Messages';

const THEMES = {
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-100', dark: 'dark:bg-blue-900', hover: 'hover:bg-blue-700' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-100', dark: 'dark:bg-emerald-900', hover: 'hover:bg-emerald-700' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-600', light: 'bg-rose-100', dark: 'dark:bg-rose-900', hover: 'hover:bg-rose-700' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-100', dark: 'dark:bg-amber-900', hover: 'hover:bg-amber-600' },
  violet: { bg: 'bg-violet-600', text: 'text-violet-600', light: 'bg-violet-100', dark: 'dark:bg-violet-900', hover: 'hover:bg-violet-700' }
};

export default function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'units' | 'requests' | 'finance' | 'messages'>('units');
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State های تم و حالت شب
  const [themeName, setThemeName] = useState<keyof typeof THEMES>('blue');
  const [isDark, setIsDark] = useState(false);
  
  // State های مدال‌ها
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as keyof typeof THEMES;
    const savedDark = localStorage.getItem('app_dark') === 'true';
    if (savedTheme && THEMES[savedTheme]) setThemeName(savedTheme);
    setIsDark(savedDark);
    if (savedDark) document.documentElement.classList.add('dark');
  }, []);

  const changeTheme = (name: keyof typeof THEMES) => {
    setThemeName(name);
    localStorage.setItem('app_theme', name);
  };

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('app_dark', String(newDark));
    if (newDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const theme = THEMES[themeName];

  // State های اطلاعیه
  const [announcement, setAnnouncement] = useState<any>(null);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annText, setAnnText] = useState('');
  const [annSaving, setAnnSaving] = useState(false);

  // State های مدال ویرایش واحد
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ owner: '', status: 'vacant', debt: 0 });
  const [saving, setSaving] = useState(false);

  // State های مدال پروفایل
  const [showProfile, setShowProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });
  
  // State بکاپ
  const [backupLoading, setBackupLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unitsRes, annRes] = await Promise.all([
        api.get('/units'),
        api.get('/announcements')
      ]);
      setUnits(unitsRes.data.units);
      if (annRes.data.announcements && annRes.data.announcements.length > 0) {
        setAnnouncement(annRes.data.announcements[0]);
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

  const downloadBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.get('/backup');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `block-118-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('خطا در دریافت فایل بکاپ');
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
      <header className={`${theme.bg} text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center rounded-b-2xl transition-colors duration-300`}>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Block-118</h1>
          <p className="text-xs text-white/80 mt-1">{user.name} خوش آمدید</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleDarkMode} className="bg-black/10 hover:bg-black/20 transition-colors p-2 rounded-xl text-sm font-medium">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowSettings(true)} className="bg-black/10 hover:bg-black/20 transition-colors p-2 rounded-xl text-sm font-medium">
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={() => setShowProfile(true)} className="bg-black/10 hover:bg-black/20 transition-colors p-2 rounded-xl text-sm font-medium">
            <User className="w-5 h-5" />
          </button>
          <button onClick={onLogout} className="bg-black/10 hover:bg-red-500 transition-colors px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>
      </header>

      {(announcement || user.role === 'admin') && (
        <div className="max-w-3xl mx-auto px-4 mt-4">
          {announcement ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-2xl p-4 flex items-start gap-3 shadow-sm relative group transition-colors">
              <Megaphone className="w-6 h-6 text-yellow-600 dark:text-yellow-500 mt-1 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium leading-relaxed whitespace-pre-wrap">{announcement.text}</p>
                <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-2">{new Date(announcement.createdAt).toLocaleString('fa-IR')}</p>
              </div>
              {user.role === 'admin' && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setAnnText(announcement.text); setShowAnnModal(true); }} className="text-yellow-600 dark:text-yellow-500 hover:text-yellow-800 p-1"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={deleteAnnouncement} className="text-yellow-600 dark:text-yellow-500 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ) : (
            user.role === 'admin' && (
              <button onClick={() => { setAnnText(''); setShowAnnModal(true); }} className="w-full bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 border-dashed text-yellow-700 dark:text-yellow-500 py-3 rounded-2xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-yellow-100 transition-colors">
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
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-colors">
                  <div className={`${theme.light} dark:bg-gray-700 p-3 rounded-xl ${theme.text}`}><Building2 className="w-6 h-6" /></div>
                  <div><p className="text-gray-500 dark:text-gray-400 text-sm">کل واحدها</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100">{units.length}</p></div>
                </div>
              </div>
            )}
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{user.role === 'admin' ? 'لیست واحدها' : 'واحد من'}</h2>
            {loading ? (
              <div className={`flex justify-center py-10 ${theme.text}`}><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {units.map((unit) => (
                  <div key={unit.id} onClick={() => user.role === 'admin' && openUnit(unit)} className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all ${user.role === 'admin' ? 'cursor-pointer hover:shadow-md' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-800 dark:text-gray-100">واحد {unit.unitNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-md ${unit.status === 'vacant' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400' : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'}`}>{unit.status === 'vacant' ? 'خالی' : 'ساکن دارد'}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">طبقه {unit.floor}</p>
                    {unit.owner && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">مالک: {unit.owner}</p>}
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

      <nav className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around p-2 pb-safe z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] transition-colors">
        <button onClick={() => setActiveTab('units')} className={`flex flex-col items-center p-2 ${activeTab === 'units' ? theme.text : 'text-gray-400 dark:text-gray-500'}`}>
          <Home className="w-6 h-6" /><span className="text-[10px] mt-1 font-medium">داشبورد</span>
        </button>
        <button onClick={() => setActiveTab('messages')} className={`flex flex-col items-center p-2 ${activeTab === 'messages' ? theme.text : 'text-gray-400 dark:text-gray-500'}`}>
          <MessageCircle className="w-6 h-6" /><span className="text-[10px] mt-1 font-medium">پیام‌ها</span>
        </button>
        <button onClick={() => setActiveTab('requests')} className={`flex flex-col items-center p-2 ${activeTab === 'requests' ? theme.text : 'text-gray-400 dark:text-gray-500'}`}>
          <Wrench className="w-6 h-6" /><span className="text-[10px] mt-1 font-medium">درخواست‌ها</span>
        </button>
        <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center p-2 ${activeTab === 'finance' ? theme.text : 'text-gray-400 dark:text-gray-500'}`}>
          <Wallet className="w-6 h-6" /><span className="text-[10px] mt-1 font-medium">شارژها</span>
        </button>
      </nav>

      {/* مدال تنظیمات ظاهری */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-500" /> تنظیمات</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">رنگ اپلیکیشن را انتخاب کنید:</p>
            <div className="flex justify-between gap-2 mb-6">
              {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map(color => (
                <button 
                  key={color} 
                  onClick={() => changeTheme(color)}
                  className={`w-12 h-12 rounded-full ${THEMES[color].bg} ${themeName === color ? 'ring-4 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : 'opacity-70'} transition-all`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl mb-4">
              <span className="font-bold text-gray-700 dark:text-gray-200">حالت شب (تیره)</span>
              <button onClick={toggleDarkMode} className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-600'}`}>
                {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
            </div>

            <button onClick={() => { setShowSettings(false); setShowHelp(true); }} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5" /> راهنمای کاربران
            </button>
          </div>
        </div>
      )}

      {/* مدال راهنما */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-blue-500" /> راهنمای کاربران</h3>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            
            <div className="overflow-y-auto pr-1 text-sm text-gray-600 dark:text-gray-300 space-y-4">
              <div>
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">👤 راهنمای ساکنین</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>ورود:</strong> با شماره واحد و رمز اختصاصی خود وارد شوید.</li>
                  <li><strong>تغییر رمز:</strong> از طریق آیکون پروفایل (👤) در بالای صفحه انجام دهید.</li>
                  <li><strong>شارژها:</strong> مشاهده بدهی و تاریخچه پرداخت‌ها در تب شارژها.</li>
                  <li><strong>درخواست تعمیرات:</strong> ثبت خرابی در تب درخواست‌ها و پیگیری وضعیت.</li>
                  <li><strong>ارتباط با مدیر:</strong> ارسال پیام در تب پیام‌ها.</li>
                  <li><strong>اطلاعیه‌ها:</strong> پیام‌های گروهی مدیر در بالای داشبورد شما نمایش داده می‌شود.</li>
                </ul>
              </div>

              {user.role === 'admin' && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">👑 راهنمای مدیر</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>ویرایش واحدها:</strong> با کلیک روی هر واحد در داشبورد، مالک و بدهی را تغییر دهید.</li>
                    <li><strong>امور مالی:</strong> در تب شارژها، صدور شارژ گروهی یا تک‌نفره و ثبت پرداخت‌ها.</li>
                    <li><strong>مدیریت درخواست‌ها:</strong> تغییر وضعیت خرابی‌ها به "در حال بررسی" یا "انجام شد".</li>
                    <li><strong>اطلاعیه:</strong> استفاده از بنر زرد رنگ در بالای داشبورد برای پیام به همه.</li>
                    <li><strong>بکاپ:</strong> دریافت فایل پشتیبان از طریق آیکون پروفایل (👤).</li>
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">📲 نصب روی گوشی</h4>
                <p>در مرورگر کروم، منوی سه نقطه را باز کرده و گزینه <strong>Add to Home Screen</strong> را انتخاب کنید تا آیکون اپ روی صفحه اصلی قرار بگیرد.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مدال ویرایش واحد */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !saving && setSelectedUnit(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Edit3 className={`w-5 h-5 ${theme.text}`} /> ویرایش واحد {selectedUnit.unitNumber}</h3>
              <button onClick={() => setSelectedUnit(null)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">نام مالک</label><input type="text" value={editForm.owner} onChange={e => setEditForm({...editForm, owner: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="خالی بگذارید اگر ساکن ندارد" /></div>
              <div><label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">وضعیت واحد</label><select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="vacant">خالی</option><option value="occupied">ساکن دارد</option></select></div>
              <div><label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">بدهی (تومان)</label><input type="number" value={editForm.debt} onChange={e => setEditForm({...editForm, debt: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-left bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" dir="ltr" /></div>
            </div>
            <button onClick={handleSaveUnit} disabled={saving} className={`w-full mt-6 ${theme.bg} ${theme.hover} text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors`}>{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</button>
          </div>
        </div>
      )}

      {/* مدال پروفایل و بکاپ */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !passLoading && setShowProfile(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Key className={`w-5 h-5 ${theme.text}`} /> تنظیمات حساب</h3>
              <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">رمز عبور جدید</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-left bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" dir="ltr" placeholder="حداقل ۶ کاراکتر" required />
              </div>
              {passMessage.text && <p className={`text-sm text-center p-2 rounded-lg ${passMessage.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>{passMessage.text}</p>}
              <button type="submit" disabled={passLoading || newPassword.length < 6} className={`w-full ${theme.bg} ${theme.hover} text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors`}>{passLoading ? 'در حال تغییر...' : 'تغییر رمز عبور'}</button>
            </form>

            {user.role === 'admin' && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <button onClick={downloadBackup} disabled={backupLoading} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {backupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  دانلود فایل پشتیبان (بکاپ)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* مدال نوشتن اطلاعیه */}
      {showAnnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !annSaving && setShowAnnModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Megaphone className="w-5 h-5 text-yellow-600" /> ثبت اطلاعیه</h3>
              <button onClick={() => setShowAnnModal(false)} className="text-gray-400 hover:text-red-500"><X /></button>
            </div>
            <textarea value={annText} onChange={e => setAnnText(e.target.value)} rows={4} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 mb-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="متن اطلاعیه (مثلا: قطعی آب فردا از ساعت ۹ تا ۱۲)"></textarea>
            <button onClick={handleSaveAnnouncement} disabled={annSaving || !annText.trim()} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors">{annSaving ? 'در حال ثبت...' : 'انتشار اطلاعیه'}</button>
          </div>
        </div>
      )}
    </div>
  );
              }
