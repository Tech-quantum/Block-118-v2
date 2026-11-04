import requests
import getpass

API_KEY = "AIzaSyDwojnNPEpQKADXEXLNI4avDdtDlu9s5qw"
PROJECT_ID = "block-118-f2918"
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def main():
    print("--- ریست اطلاعات Block-118 ---")
    password = getpass.getpass("رمز ادمین را وارد کنید: ")

    auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    res = requests.post(auth_url, json={"email": "admin@block118.app", "password": password, "returnSecureToken": True})
    if not res.ok:
        print("❌ رمز عبور اشتباه است.")
        return

    token = res.json()["idToken"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    api_param = f"?key={API_KEY}"
    print("✅ ورود موفق.\n")

    # حذف تراکنش‌ها با بررسی دقیق
    print("در حال حذف تراکنش‌ها...")
    trans_res = requests.get(f"{BASE_URL}/transactions{api_param}", headers=headers)
    if trans_res.status_code == 200:
        trans = trans_res.json().get("documents", [])
        deleted_count = 0
        for t in trans:
            t_id = t['name'].split('/')[-1]
            del_res = requests.delete(f"{BASE_URL}/transactions/{t_id}{api_param}", headers=headers)
            if del_res.status_code == 200:
                deleted_count += 1
            else:
                print(f"❌ خطا در حذف تراکنش {t_id}: {del_res.text}")
        print(f"✅ {deleted_count} تراکنش از {len(trans)} تراکنش با موفقیت حذف شد.\n")
    else:
        print(f"❌ خطا در خواندن تراکنش‌ها: {trans_res.text}\n")

    # حذف هزینه‌ها با بررسی دقیق
    print("در حال حذف هزینه‌ها...")
    exp_res = requests.get(f"{BASE_URL}/expenses{api_param}", headers=headers)
    if exp_res.status_code == 200:
        exps = exp_res.json().get("documents", [])
        deleted_exp = 0
        for e in exps:
            e_id = e['name'].split('/')[-1]
            del_res = requests.delete(f"{BASE_URL}/expenses/{e_id}{api_param}", headers=headers)
            if del_res.status_code == 200:
                deleted_exp += 1
            else:
                print(f"❌ خطا در حذف هزینه {e_id}: {del_res.text}")
        print(f"✅ {deleted_exp} هزینه از {len(exps)} هزینه با موفقیت حذف شد.\n")
    else:
        print(f"❌ خطا در خواندن هزینه‌ها: {exp_res.text}\n")

    print("🎉 عملیات به پایان رسید.")

if __name__ == "__main__":
    main()
