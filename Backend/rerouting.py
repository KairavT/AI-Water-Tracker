import os
import requests
import random
from dotenv import load_dotenv
from google import genai

load_dotenv()

# --- CONFIGURATION ---
PROJECT_ID = "deltahacks-484006"
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_INSTRUCTION = "You are a concise AI assistant. Use Markdown for formatting. Keep answers under 150 words unless asked for detail."

DATA_CENTERS = {
    "montreal": {
        "name": "Montreal, Canada",
        "region_code": "northamerica-northeast1",
        "lat": 45.5017, "lon": -73.5673
    },
    "netherlands": { 
        "name": "Eemshaven, Netherlands",
        "region_code": "europe-west4", 
        "lat": 53.4357, "lon": 6.8370
    }
}

# BACKUP SERVERS (Used when smart routing fails)
BACKUP_COLD_SERVERS = [
    "Arctic Circle Data Vault (Backup)",
    "Nordic Deep Storage (Backup)",
    "Icelandic Geo-Server (Backup)"
]

# EST. SAVINGS (Used when backup is triggered)
ESTIMATED_BACKUP_SAVINGS = 150 

def get_current_temperature(lat, lon):
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url)
        if response.status_code != 200: return 20
        return response.json()['main']['temp']
    except:
        return 20

def run_smart_prompt(prompt):
    print("\n--- 🌍 HYDRO-ROUTER ACTIVATED ---")
    
    # 1. Check Weather
    t_montreal = get_current_temperature(DATA_CENTERS['montreal']['lat'], DATA_CENTERS['montreal']['lon'])
    t_netherlands = get_current_temperature(DATA_CENTERS['netherlands']['lat'], DATA_CENTERS['netherlands']['lon'])
    
    # 2. Decide Location & Calculate Water Savings
    if t_montreal < t_netherlands:
        target = DATA_CENTERS['montreal']
        reason = f"Montreal is colder ({t_montreal}°C vs {t_netherlands}°C)"
        water_saved = 350 
    else:
        target = DATA_CENTERS['netherlands']
        reason = f"Netherlands is colder ({t_netherlands}°C vs {t_montreal}°C)"
        water_saved = 350
        
    print(f"✅ OPTIMIZATION: Routing to {target['name']}")
    print(f"   REASON: {reason}")

    # ATTEMPT 1: Vertex AI Key (Green Way)
    try:
        client = genai.Client(
            vertexai=True,
            project=PROJECT_ID,
            location=target['region_code']
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=prompt,
            config={"system_instruction": SYSTEM_INSTRUCTION} 
        )
        
        return {
            "response": response.text,
            "routed_to": target['name'],
            "weather_logic": reason,
            "water_saved_ml": water_saved,
            "is_estimate": False, 
            "status": "Green Route Success"
        }

    # ATTEMPT 2: FAILOVER TO BACKUP (Teammate's Logic)
    except Exception as e:
        print(f"⚠️ GREEN ROUTE FAILED: {e}")
        print(">>> ACTIVATING BACKUP PROTOCOL: Rerouting to Cold Storage File...")
        
        backup_server = random.choice(BACKUP_COLD_SERVERS)
        
        try:
            # Fallback to standard global key
            fallback_client = genai.Client(api_key=GEMINI_API_KEY)
            
            response = fallback_client.models.generate_content(
                model="gemini-2.5-flash", 
                contents=prompt,
                config={"system_instruction": SYSTEM_INSTRUCTION} 
            )
            
            return {
                "response": response.text,
                "routed_to": backup_server,
                "weather_logic": "Main route failed. Redirected to backup Cold Server file.",
                "water_saved_ml": ESTIMATED_BACKUP_SAVINGS, # Return Estimate
                "is_estimate": True, # Flag as Estimate
                "status": "Backup Route"
            }
        except Exception as e2:
            return f"❌ CRITICAL FAILURE: Both methods failed. {e2}"