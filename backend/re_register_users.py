
import requests

BASE_URL = "http://localhost:8000"

def ensure_users():
    student = {"email": "student@example.com", "password": "password", "role": "student"}
    teacher = {"email": "teacher@example.com", "password": "password", "role": "teacher"}
    
    # 1. Register student
    print("Ensuring student@example.com exists...")
    res = requests.post(f"{BASE_URL}/users", json=student)
    if res.status_code == 200:
        print("Student registered successfully.")
    elif res.status_code == 400:
        print("Student already exists.")
    else:
        print(f"Error registering student: {res.text}")

    # 2. Register teacher
    print("Ensuring teacher@example.com exists...")
    res = requests.post(f"{BASE_URL}/users", json=teacher)
    if res.status_code == 200:
        print("Teacher registered successfully.")
    elif res.status_code == 400:
        print("Teacher already exists.")
    else:
        print(f"Error registering teacher: {res.text}")

if __name__ == "__main__":
    try:
        ensure_users()
    except Exception as e:
        print(f"Server might not be ready yet: {e}")
