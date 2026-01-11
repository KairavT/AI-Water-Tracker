from flask import Flask, render_template, request, jsonify
from flask_cors import CORS 
from rerouting import run_smart_prompt 

app = Flask(__name__)
CORS(app) 

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    user_prompt = data.get('prompt', '')

    print(f"\n📨 NEW REQUEST: {user_prompt[:50]}...")

    result = run_smart_prompt(user_prompt)

    if isinstance(result, str):
        return jsonify({
            "response": result, 
            "routed_to": "Error", 
            "weather_logic": "System Failure",
            "water_saved_ml": 0,
            "is_estimate": False
        })

    return jsonify({
        "response": result['response'],
        "routed_to": result['routed_to'],
        "weather_logic": result.get('weather_logic', 'Standard Route'),
        "water_saved_ml": result.get('water_saved_ml', 0),
        "is_estimate": result.get('is_estimate', False) # <--- Sending this to React
    })

if __name__ == '__main__':
    print("🚀 SERVER STARTED: Go to http://127.0.0.1:5000")
    app.run(debug=True, port=5000)