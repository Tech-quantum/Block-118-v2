# 🤝 سند تحویل پروژه (Handoff Document)
**پروژه:** Block-118-v2 (سیستم مدیریت هوشمند ساختمان)
**آدرس:** `https://block-118-v2.vercel.app`

## 🏗 معماری کلی (Architecture)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Lucide Icons.
- **Backend:** Vercel Serverless Functions (Node.js).
- **Database:** Firebase Firestore.
- **Auth:** Firebase Auth (با استفاده از REST API در سمت سرور).
- **الگو:** BFF (مرورگر -> Vercel -> Firebase). هیچ اتصال مستقیمی از مرورگر به Firebase برقرار نمی‌شود.

## 🚨 محدودیت‌های حیاتی (Critical Constraints)
1. **سقف ۱۲ فایل API:** پلن رایگان Vercel اجازه ساخت بیش از ۱۲ فایل در پوشه `api/` را نمی‌دهد. **هرگز فایل جدیدی اضافه نکنید.** اگر قابلیت جدیدی نیاز است، آن را داخل یکی از فایل‌های موجود (با استفاده از `req.query` یا `req.body.action`) پیاده‌سازی کنید.
2. **عدم استفاده از Firebase Admin SDK:** به دلیل خطای `ERR_REQUIRE_ESM` در ورسل، از پکیج `firebase-admin` استفاده نمی‌کنیم. تمام عملیات دیتابیس با `fetch` به REST API فایربیس و با توکن خود کاربر (که در هدر `Authorization` ارسال می‌شود) انجام می‌شود.
3. **امنیت Firestore:** امنیت داده‌ها ۱۰۰٪ به `firestore.rules` وابسته است. هرگونه تغییر در ساختار داده باید با آپدیت Rules همراه باشد.

## 📂 ساختار دیتابیس (Firestore Collections)
- `units`: اطلاعات ۴۰ واحد (مالک، طبقه، وضعیت، بدهی/طلب).
- `requests`: درخواست‌های تعمیرات (شامل تصویر Base64 و بندانگشتی).
- `messages`: پیام‌های چت (گروهی و اختصاصی).
- `transactions`: تراکنش‌های مالی (شارژ و پرداخت).
- `expenses`: هزینه‌های ساختمان.
- `announcements`: اطلاعیه‌های مدیر.
- `summary/stats`: سند تک‌نفره برای نگهداری موجودی کل صندوق (جهت نمایش به ساکنین).

## 🔑 متغیرهای محیطی (Environment Variables در Vercel)
- `FIREBASE_API_KEY`: کلید API پروژه فایربیس (جهت ورود و تایید توکن).

## 📁 ساختار فایل‌های کلیدی
- `api/auth/login.ts`: ورود کاربر.
- `api/auth/change-password.ts`: تغییر رمز.
- `api/units.ts`: مدیریت واحدها.
- `api/requests.ts`: لیست و ثبت درخواست‌ها.
- `api/requests/[id].ts`: تغییر وضعیت و حذف نرم درخواست‌ها.
- `api/messages.ts`: سیستم چت.
- `api/transactions.ts`: تراکنش‌ها + محاسبه و آپدیت موجودی صندوق (`mode=summary`).
- `api/expenses.ts`: مدیریت هزینه‌ها (GET, POST, PATCH, DELETE).
- `api/announcements.ts`: اطلاعیه‌ها.
- `api/backup.ts`: دانلود فایل JSON کل دیتابیس (فقط ادمین).
- `firestore.rules`: قوانین امنیتی دیتابیس.
- `src/components/`: کامپوننت‌های React (Dashboard, Finance, Requests, Messages, Expenses, ...).

## 🚀 راه‌اندازی مجدد (در صورت نیاز)
۱. کلون کردن ریپازیتوری.
۲. `npm install`
۳. ساخت فایل `.env` و قرار دادن `FIREBASE_API_KEY` در آن.
۴. `vercel dev` (برای محیط لوکال).
