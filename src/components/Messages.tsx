import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Loader2, Send, Users } from 'lucide-react';

export default function Messages({ user }: { user: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [receiver, setReceiver] = useState('all');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages');
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const actualReceiver = user.role === 'admin' ? receiver : 'admin';
      await api.post('/messages', { receiver: actualReceiver, text });
      setText('');
      fetchMessages();
    } catch (err) {
      alert('خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  const adminReceivers = [
    { value: 'all', label: '📢 ارسال به همه (گروهی)' },
    ...Array.from({ length: 10 }).flatMap((_, f) => 
      Array.from({ length: 4 }).map((_, u) => {
        const unitNum = `${f + 1}0${u + 1}`;
        return { value: unitNum, label: `واحد ${unitNum}` };
      })
    )
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700 font-bold">
          <Users className="w-5 h-5 text-blue-600" /> صندوق پیام‌ها
        </div>
        <span className="text-xs text-gray-400">به عنوان {user.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-4 mb-3">
        {loading ? (
          <div className="flex justify-center py-10 text-blue-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">هیچ پیامی وجود ندارد.</p>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === user.username;
            const isGroup = msg.receiver === 'all';
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-500 mb-1 px-1">
                  {isMe ? 'شما' : (msg.sender === 'admin' ? 'مدیر' : `واحد ${msg.sender}`)}
                  {isGroup && ' (گروهی)'}
                </span>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 
                  isGroup ? 'bg-green-100 text-green-800 border border-green-200 rounded-tl-sm' : 
                  'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 space-y-2">
        {user.role === 'admin' && (
          <select 
            value={receiver} 
            onChange={e => setReceiver(e.target.value)} 
            className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          >
            {adminReceivers.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={user.role === 'admin' ? "متن پیام به ساکنین..." : "ارسال پیام به مدیر ساختمان..."}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <button type="submit" disabled={sending} className="bg-blue-600 text-white p-2.5 rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors">
            {/* 👈 اصلاح نهایی جهت آیکون */}
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -rotate-45" />}
          </button>
        </div>
      </form>
    </div>
  );
}
