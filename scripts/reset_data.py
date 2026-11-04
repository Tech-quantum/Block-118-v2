import requests
import getpass
import json

# تنظیمات پروژه
API_KEY = "AIzaSyDwojnNPEpQKADXEXLNI4avDdtDlu9s5qw"
PROJECT_ID = "block-118-f2918"
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def reset_financial_data():
    print("--- سیستم صفر کردن اطلاعات مالی Block-118 ---")
    email = "admin@block118.app"
    # گرفتن رمز به صورت مخفی (در ترمینال نمایش داده نمی‌شود)
    password = getpass.getpass(f"رمز عبور برای {email} را وارد کنید: ")

    # ۱. لاگین به فایربیس
    print("در حال ورود به سیستم...")
    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    auth_payload = {"email": email, "password": password, "returnSecureToken": True}
    
    res = requests.post(auth_url, json=auth_payload)
    if not res.ok:
        print("❌ خطا در ورود. رمز عبور را چک کنید.")
        return

    token = res.json()["idToken"]
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    print("✅ ورود موفقیت‌آمیز بود.\n")

    # ۲. صفر کردن بدهی تمام واحدها
    print("در حال صفر کردن بدهی ۴۰ واحد...")
    units_res = requests.get(f"{BASE_URL}/units", headers=headers)
    units = units_res.json().get("documents", [])
    
    for unit in units:
        unit_id = unit["name"].split("/")[-1]
        requests.patch(
            f"{BASE_URL}/units/{unit_id}?updateMask.fieldPaths=debt",
            headers=headers,
            json={"fields": {"debt": {"integerValue": "0"}}}
        )
    print(f"✅ بدهی {len(units)} واحد صفر شد.\n")

    # ۳. حذف تمام تراکنش‌ها
    print("در حال حذف تراکنش‌های مالی...")
    trans_res = requests.get(f"{BASE_URL}/transactions", headers=headers)
    transactions = trans_res.json().get("documents", [])
    
    for t in transactions:
        t_id = t["name"].split("/")[-1]
        requests.delete(f"{BASE_URL}/transactions/{t_id}", headers=headers)
    print(f"✅ {len(transactions)} تراکنش حذف شد.\n")

    # ۴. حذف تمام هزینه‌ها
    print("در حال حذف هزینه‌های ساختمان...")
    exp_res = requests.get(f"{BASE_URL}/expenses", headers=headers)
    expenses = exp_res.json().get("documents", [])
    
    for e in expenses:
        e_id = e["name"].split("/")[-1]
        requests.delete(f"{BASE_URL}/expenses/{e_id}", headers=headers)
    print(f"✅ {len(expenses)} هزینه حذف شد.\n")

    # ۵. صفر کردن موجودی صندوق
    print("در حال صفر کردن موجودی صندوق...")
    requests.patch(
        f"{BASE_URL}/summary/stats?updateMask.fieldPaths=fundBalance",
        headers=headers,
        json={"fields": {"fundBalance": {"integerValue": "0"}}}
    )
    print("✅ موجودی صندوق صفر شد.\n")

    print("🎉 تمام اطلاعات مالی با موفقیت صفر شد! سایت را رفرش کنید.")

if __name__ == "__main__":
    reset_financial_data()
