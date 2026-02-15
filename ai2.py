import requests
import json
import os
import time
import re
import shutil
import subprocess
from datetime import datetime

# ================= CONFIGURATION =================
API_KEYS = [
    "AIzaSyBb_GM0WmBj0qKMo-799JhFaHc1EG3ce78", 
    "AIzaSyBH0WO3e_FYFmhQo9Bdww-waqimwo3fsTU",
    "AIzaSyAWc7x3jMe8IoF6vrGmWCQ8d8f1fJ3qNcQ",
    "AIzaSyBxUxO7pzzwzsBySOil4XyaBEtdd-PWXV4"
]

BASE_URL = "https://generativelanguage.googleapis.com"
MODELS = ["gemini-2.0-flash", "gemini-1.5-pro"]

# স্ক্যান করার সময় এই ফোল্ডারগুলো বাদ দিবে
IGNORE_DIRS = {'node_modules', '.git', '.expo', 'dist', 'build', '.idea', 'android', 'ios', '__pycache__'}
ALLOWED_EXTENSIONS = {'.tsx', '.ts', '.jsx', '.js', '.json', '.css', '.html'}

current_key_index = 0
project_context_cache = None # মেমোরি

def get_active_key():
    global current_key_index
    return API_KEYS[current_key_index]

def switch_key():
    global current_key_index
    current_key_index = (current_key_index + 1) % len(API_KEYS)
    print(f"\n🔑 Switching Key...")

# --- 1. গিটহাবে অটো পুশ ---
def git_auto_push(commit_message):
    print("\n🐙 Pushing to GitHub...")
    try:
        subprocess.run("git add .", shell=True, check=True)
        # সময় দিয়ে কমিট মেসেজ দেওয়া হবে
        timestamp = datetime.now().strftime("%H:%M:%S")
        subprocess.run(f'git commit -m "AI Update at {timestamp}: {commit_message}"', shell=True)
        subprocess.run("git push", shell=True)
        print("✅ GitHub Push Successful!")
    except Exception as e:
        print(f"⚠️ Git Push Failed (Check Internet/Auth): {e}")

# --- 2. স্মার্ট স্ক্যানার (মেমোরি সহ) ---
def get_project_context(force_refresh=False):
    global project_context_cache
    
    if project_context_cache and not force_refresh:
        return project_context_cache

    print("📂 Scanning project files...", end="\r")
    context_str = "CURRENT PROJECT CODE:\n"
    total_chars = 0
    MAX_CHARS = 95000 

    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in ALLOWED_EXTENSIONS:
                path = os.path.join(root, file)
                # ব্যাকআপ ফাইল স্কিপ করবে
                if path.endswith(".bak"): continue
                
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if len(content) < 8000 and total_chars < MAX_CHARS:
                            context_str += f"\n--- FILE: {path} ---\n{content}\n"
                            total_chars += len(content)
                except: pass
    
    project_context_cache = context_str
    print(f"✅ Context Loaded! ({total_chars} chars)      ")
    return context_str

# --- 3. মেইন ব্রেইন ---
def ask_gemini(prompt):
    context = get_project_context(force_refresh=False)
    
    system_prompt = f"""
    You are a Senior Lead Developer.
    You have FULL PERMISSION to overwrite files.
    
    YOUR JOB:
    1. Read the user request.
    2. Output the FULL code for the file(s) that need changes.
    3. DO NOT use placeholders like "// ... rest of code". Write everything.
    
    FORMAT:
    ### FILE: path/to/file.ext
    ```tsx
    // code...
    ```
    
    {context}
    """
    
    payload = {
        "contents": [{"parts": [{"text": f"{system_prompt}\n\nUser Request: {prompt}"}]}]
    }
    headers = {"Content-Type": "application/json"}

    for attempt in range(5):
        key = get_active_key()
        model = MODELS[0] # Best model first
        url = f"{BASE_URL}/v1beta/models/{model}:generateContent?key={key}"
        print(f"🧠 AI Working... ", end="\r")
        
        try:
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            if response.status_code == 200:
                return response.json()['candidates'][0]['content']['parts'][0]['text']
            elif response.status_code == 429:
                switch_key()
            else:
                time.sleep(1)
        except: time.sleep(1)
    return "❌ Connection Failed."

# --- 4. ফাইল সেভ + পুশ ---
def process_ai_response(response, user_prompt):
    global project_context_cache
    if not response: return

    pattern = r"### FILE: (.*?)\n```(?:\w+)?\n(.*?)```"
    matches = re.findall(pattern, response, re.DOTALL)

    if not matches:
        print("\n💬 AI Suggestion:\n", response)
        return

    print("\n" + "="*40)
    files_changed = False

    for filename, code in matches:
        filename = filename.strip()
        folder = os.path.dirname(filename)
        if folder and not os.path.exists(folder): os.makedirs(folder)
        
        # 🛡️ সেফটি ব্যাকআপ (যাতে কোড নষ্ট না হয়)
        if os.path.exists(filename):
            shutil.copy(filename, filename + ".bak")
            print(f"🛡️ Backup: {filename}.bak")

        # 🔥 ডাইরেক্ট এডিট
        with open(filename, "w", encoding="utf-8") as f:
            f.write(code)
        
        print(f"💾 UPDATED: {filename}")
        files_changed = True

    print("="*40 + "\n")
    
    if files_changed:
        # ১. ক্যাশ ক্লিয়ার (যাতে পরের বার নতুন কোড পড়ে)
        project_context_cache = None 
        # ২. অটো গিট পুশ
        git_auto_push(user_prompt)

if __name__ == "__main__":
    print(f"🚀 AI BOSS MODE (Direct Edit + Auto Push) Started!")
    # প্রথমে একবার স্ক্যান
    get_project_context(force_refresh=True)
    
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]: break
        
        if user_input.lower() in ["refresh", "rescan"]:
            get_project_context(force_refresh=True)
            continue

        result = ask_gemini(user_input)
        process_ai_response(result, user_input)
