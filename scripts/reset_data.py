import requests
import getpass

API_KEY = "AIzaSyDwojnNPEpQKADXEXLNI4avDdtDlu9s5qw"
PROJECT_ID = "block-118-f2918"
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def main():
    print("--- ریست اطلاعات Block-118 ---")
    password = getpass.getpass("رمز ادمین را وارد کنید: ")

    # ۱. لاگین
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    res = requests.post(auth_url, json={"email": "admin@block118.app", "password": password, "returnSecureToken": True})
    
    if not res.ok:
        print("❌ رمز عبور اشتباه است.")
        return

    token = res.json()["idToken"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("✅ ورود موفق.\n")

    # 👈 اصلاح مهم: اضافه کردن کلید API به تمام آدرس‌ها
    api_param = f"?key={API_KEY}"

    # ۲. تست دسترسی به واحدها
    print("در حال تست دسترسی به دیتابیس...")
    test_res = requests.get(f"{BASE_URL}/units{api_param}", headers=headers)
    
    if test_res.status_code != 200:
        print(f"❌ دسترسی مسدود است! کد خطا: {test_res.status_code}")
        print(f"پیام دقیق گوگل: {test_res.text}")
        return # توقف کامل اسکریپت
    else:
        print("✅ دسترسی به دیتابیس برقرار است.")
        units = test_res.json().get("documents", [])
        print(f"📦 تعداد واحدهای موجود در دیتابیس: {len(units)}\n")

    # ۳. صفر کردن بدهی واحدها
    print("در حال صفر کردن بدهی واحدها...")
    if len(units) == 0:
        print("⚠️ لیست واحدها خالی بود. در حال ساخت ۴۰ واحد...")
        for floor in range(1, 11):
            for unit in range(1, 5):
                unit_num = f"{floor}0{unit}"
                requests.patch(f"{BASE_URL}/units/{unit_num}{api_param}", headers=headers, json={"fields": {"unitNumber": {"stringValue": unit_num}, "floor": {"integerValue": str(floor)}, "debt": {"integerValue": "0"}, "status": {"stringValue": "vacant"}}})
    else:
        for u in units:
            u_id = u["name"].split("/")[-1]
            requests.patch(f"{BASE_URL}/units/{u_id}?updateMask.fieldPaths=debt{api_param.replace('?', '&')}", headers=headers, json={"fields": {"debt": {"integerValue": "0"}}})
    print("✅ عملیات واحدها پایان یافت.\n")

    # ۴. حذف تراکنش‌ها
    print("در حال حذف تراکنش‌ها...")
    trans_res = requests.get(f"{BASE_URL}/transactions{api_param}", headers=headers)
    if trans_res.status_code == 200:
        trans = trans_res.json().get("documents", [])
        for t in trans:
            requests.delete(f"{BASE_URL}/transactions/{t['name'].split('/')[-1]}{api_param}", headers=headers)
        print(f"✅ {len(trans)} تراکنش حذف شد.\n")
    else:
        print(f"❌ خطا در خواندن تراکنش‌ها: {trans_res.text}\n")

    # ۵. حذف هزینه‌ها
    print("در حال حذف هزینه‌ها...")
    exp_res = requests.get(f"{BASE_URL}/expenses{api_param}", headers=headers)
    if exp_res.status_code == 200:
        exps = exp_res.json().get("documents", [])
        for e in exps:
            requests.delete(f"{BASE_URL}/expenses/{e['name'].split('/')[-1]}{api_param}", headers=headers)
        print(f"✅ {len(exps)} هزینه حذف شد.\n")
    else:
        print(f"❌ خطا در خواندن هزینه‌ها: {exp_res.text}\n")

    # ۶. صفر کردن صندوق
    print("در حال صفر کردن صندوق...")
    requests.patch(f"{BASE_URL}/summary/stats?updateMask.fieldPaths=fundBalance{api_param.replace('?', '&')}", headers=headers, json={"fields": {"fundBalance": {"integerValue": "0"}}})
    print("✅ صندوق صفر شد.\n")

    print("🎉 تمام عملیات به پایان رسید.")

if __name__ == "__main__":
    main()
