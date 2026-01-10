import os
import requests
from dotenv import load_dotenv
from google import genai

load_dotenv()

# --- CONFIGURATION ---
PROJECT_ID = "gen-lang-client-0397971089"
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

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
    
    # 2. Decide Location
    if t_montreal < t_netherlands:
        target = DATA_CENTERS['montreal']
        reason = f"Montreal is colder ({t_montreal}°C vs {t_netherlands}°C)"
    else:
        target = DATA_CENTERS['netherlands']
        reason = f"Netherlands is colder ({t_netherlands}°C vs {t_montreal}°C)"
        
    print(f"✅ OPTIMIZATION: Routing to {target['name']}")
    print(f"   REASON: {reason}")

    # ATTEMPT 1: Vertex AI Key (Green Way)
    try:
        client = genai.Client(
            vertexai=True,
            project=PROJECT_ID,
            location=target['region_code']
        )
        # Use the specific model version
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=prompt
        )
        return {
            "response": response.text,
            "routed_to": target['name'],
            "status": "Green Route Success"
        }

    # Standard API Key
    except Exception as e:
        print(f"⚠️ GREEN ROUTE FAILED: {e}")
        print("🔄 SWITCHING TO FALLBACK: Using Standard Global Server...")
        
        try:
            # Fallback Client
            fallback_client = genai.Client(api_key=GEMINI_API_KEY)
            
            response = fallback_client.models.generate_content(
                model="gemini-2.5-flash", 
                contents=prompt
            )
            return {
                "response": response.text,
                "routed_to": "Global Default (Fallback)",
                "status": "Standard Route (Green failed)"
            }
        except Exception as e2:
            return f"❌ CRITICAL FAILURE: Both methods failed. {e2}"

if __name__ == "__main__":
    result = run_smart_prompt("Why is saving water important?")
    print("\n🤖 AI OUTPUT:")
    print(result['response'] if isinstance(result, dict) else result)