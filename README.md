# 🌊 H2Optimize - "Water Saving" Chatbot

https://github.com/user-attachments/assets/df3bce2c-e97e-463a-bf22-42c6c8abe54d

## 📖 About The Project

This project demonstrates a **hybrid AI architecture** designed to optimize Large Language Model (LLM) usage, reducing server load and simulated energy consumption ("saving water").

It combines the power of a **local, in-browser LLM** (Llama-3 via WebLLM) with a powerful **cloud-based LLM** (Google Gemini via Flask).

### How It Works:

1. **User Input:** The user types a prompt into the React frontend.
2. **Local Optimization (Edge AI):** Before hitting the network, an instance of **Llama-3 running directly in the user's browser** (via WebGPU) intercepts the prompt. It rewrites the prompt to be as concise as possible without losing meaning. This step costs $0 and uses no cloud server resources.
3. **Cloud Routing (Server AI):** The optimized, shortened prompt is sent to a Python **Flask** backend.
4. **Final Generation:** The backend simulates routing the request to a "cold climate data center" for efficiency and passes the shortened prompt to Google's **Gemini API** to generate the final, detailed answer.
5. **Display & Stats:** The frontend displays the final answer along with real-time statistics on how many tokens (and equivalent "water") were saved by using local pre-processing.

---

## 🛠️ Tech Stack

### Frontend (Client-Side)

A modern, type-safe SPA built for performance and local inference.

* **Framework:** [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Local AI Inference:** [@mlc-ai/web-llm](https://webllm.mlc.ai/) (Runs Llama-3 in-browser using WebGPU)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [@tailwindcss/typography](https://github.com/tailwindlabs/tailwindcss-typography)
* **HTTP Client:** [Axios](https://axios-http.com/)
* **Rendering:** [React Markdown](https://github.com/remarkjs/react-markdown)

### Backend (Server-Side)

A lightweight Python server to handle API routing and credentials.

* **Runtime:** [Python 3.x](https://www.python.org/)
* **Framework:** [Flask](https://flask.palletsprojects.com/)
* **Security/Routing:** [Flask-CORS](https://flask-cors.readthedocs.io/en/latest/)
* **Cloud AI:** [Google Generative AI (Gemini)](https://ai.google.dev/)
* **Utilities:** [python-dotenv](https://pypi.org/project/python-dotenv/)

---

## ⚙️ Prerequisites

Before running the project, ensure you have the following installed:

1. **Node.js (LTS Version):** [Download Here](https://nodejs.org/) (Required for the frontend).
2. **Python (3.9 or higher recommended):** [Download Here](https://www.python.org/) (Required for the backend).
3. **A WebGPU Compatible Browser:** The local AI requires a modern browser with WebGPU support enabled (e.g., Chrome 113+, Edge, or Firefox Nightly).
4. **Google AI API Key:** You need an API key to use Gemini. Get one here: [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## 🚀 Installation & Running

You will need to run the backend and frontend in **two separate terminal windows**.

### Project Setup (Do this first)

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

```



### Terminal 1: Backend Setup (Python/Flask)

1. Navigate to the backend directory (adjust path if necessary based on your structure):
```bash
# Example: if your main.py is in the root
# cd . 
# Example: if your main.py is in a 'backend' folder
# cd backend

```


2. (Optional but Recommended) Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate

```


3. Install Python dependencies:
```bash
pip install flask flask-cors python-dotenv google-generativeai

```


4. Create a `.env` file next to your `main.py` and add your Google API key:
```env
GOOGLE_API_KEY=your_actual_api_key_here

```


5. Start the Flask server:
```bash
python main.py

```


*The backend will start running on `http://127.0.0.1:5000`.*

### Terminal 2: Frontend Setup (React/Vite)

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend

```


2. Install Node dependencies:
```bash
npm install

```


3. Start the development server:
```bash
npm run dev

```


4. Open the URL provided in the terminal (usually `http://localhost:5173`) in your WebGPU-compatible browser.

---

## 💡 Usage Note

**The First Run will take time!**

When you first load the application in your browser, look at the status bar in the top left. It will say:

> *"Loading local AI model..."*

The browser is downloading the Llama-3 model weights (approx. 2.5GB) and caching them locally. Depending on your internet speed, this may take several minutes. Subsequent loads will be much faster as the model is loaded from the browser cache.

**Wait until the status says "System Ready" before sending a message.**

---

## ✨ Contributors

Made with 💖 by:
[@majockbim](https://github.com/majockbim)
[@KairavT](https://github.com/KairavT)
[@ToJasonYu](https://github.com/ToJasonYu)
[@jasonhbaik](https://github.com/jasonhbaik)
