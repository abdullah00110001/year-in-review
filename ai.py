import requests
import json
import os
import re

# ================= CONFIGURATION =================
API_KEY = "AIzaSyBb_GM0WmBj0qKMo-799JhFaHc1EG3ce78" # আপনার কি (Key)
MODEL_NAME = "gemini-flash-latest" # বা gemini-1.5-flash (যেটা এক্টিভ আছে)
BASE_URL = "https://generativelanguage.googleapis.com"

# যে এক্সটেনশনগুলো সে পড়বে
ALLOWED_EXTENSIONS = {'.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.java', '.xml'}
# যে ফোল্ডারগুলো সে ইগনোর করবে
IGNORE_FOLDERS = {'node_modules', '.git', 'build', 'dist', '__pycache__', '.gradle'}

def get_project_context():
    """আপনার পুরো প্রোজেক্টের ফাইল স্ট্রাকচার এবং কোড পড়ে টেক্সট বানাবে"""
    context_str = "Current Project Structure & Code:\n"
    
    for root, dirs, files in os.walk("."):
        # ইগনোর ফোল্ডার বাদ দেওয়া
        dirs[:] = [d for d in dirs if d not in IGNORE_FOLDERS]
        
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in ALLOWED_EXTENSIONS:
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # খুব বড় ফাইল হলে স্কিপ করবে (API লিমিট বাঁচানোর জন্য)
                        if len(content) < 20000: 
                            context_str += f"\n--- FILE: {file_path} ---\n{content}\n"
                except:
                    pass # বাইনারি বা রিড-এরর হলে বাদ

    return context_str

def ask_gemini(user_prompt):
    # ১. প্রোজেক্টের বর্তমান অবস্থা পড়া
    print("📂 Reading project files...", end="\r")
    project_context = get_project_context()
    
    # ২. সিস্টেম ইনস্ট্রাকশন সেট করা
    system_prompt = f"""
    You are an expert developer working inside a project.
    I will provide the current file structure and code.
    
    YOUR JOB:
    1. Understand the existing code.
    2. Implement the user's request by modifying existing files or creating new ones.
    3. You MUST output the code in this format:
    
    ### FILE: filename.ext
    ```
    code here...
    ```
    
    {project_context}
    """
    
    full_prompt = f"{system_prompt}\n\nUser Request: {user_prompt}"
    
    url = f"{BASE_URL}/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}]
    }

    try:
        print("🤖 AI is coding... (Thinking)", end="\r")
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        
        if response.status_code == 200:
            return response.json()['candidates'][0]['content']['parts'][0]['text']
        else:
            print(f"\n❌ API Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"\n❌ Connection Error: {e}")
        return None

def apply_changes(ai_response):
    """AI এর দেওয়া কোড ফাইলে সেভ করবে"""
    # Regex দিয়ে ফাইলের নাম আর কোড বের করা
    pattern = r"### FILE: (.*?)\n```(?:\w+)?\n(.*?)```"
    matches = re.findall(pattern, ai_response, re.DOTALL)

    if not matches:
        print("\n⚠️ AI just replied (No code changes):")
        print(ai_response)
        return

    print("\n" + "="*40)
    for filename, code in matches:
        filename = filename.strip()
        
        # ফোল্ডার না থাকলে বানিয়ে নেওয়া
        folder = os.path.dirname(filename)
        if folder and not os.path.exists(folder):
            os.makedirs(folder)

        # ফাইল রাইট করা
        with open(filename, "w", encoding="utf-8") as f:
            f.write(code)
            
        print(f"✅ Updated/Created: {filename}")
    print("="*40 + "\n")

# ================= MAIN LOOP =================
if __name__ == "__main__":
    print(f"🔥 Smart Project Agent Ready! (Model: {MODEL_NAME})")
    print("I can see your files. Just ask me to change anything.")
    print("Type 'exit' to stop.\n")

    while True:
        user_input = input("You: ")
        
        if user_input.lower() in ["exit", "quit"]:
            break
            
        if not user_input.strip():
            continue

        response = ask_gemini(user_input)
        
        if response:
            apply_changes(response)
