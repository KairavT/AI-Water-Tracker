from flask import Flask, render_template, request, jsonify
from rerouting import run_smart_prompt # Import function from rerouting.py

app = Flask(__name__)

# 1. Serve the Frontend
@app.route('/')
def home():
    return render_template('index.html')

# 2. The API Endpoint (Receives Prompt -> Calls Rerouter -> Returns Answer)
@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    user_prompt = data.get('prompt', '')

    print(f"\n📨 NEW REQUEST: {user_prompt[:50]}...")

    # This runs 'rerouting.py' logic (Weather check -> Green Routing)
    result = run_smart_prompt(user_prompt)
    # ----------------------

    # If result is just a string (error string), wrap it
    if isinstance(result, str):
        return jsonify({
            "response": result, 
            "routed_to": "Error", 
            "weather_logic": "System Failure"
        })

    # Return the full data to the frontend
    return jsonify({
        "response": result['response'],
        "routed_to": result['routed_to'],
        "weather_logic": result.get('weather_logic', 'Standard Route') # Safe get
    })

if __name__ == '__main__':
    # Run the server on http://127.0.0.1:5000
    print("🚀 SERVER STARTED: Go to http://127.0.0.1:5000")
    app.run(debug=True, port=5000)