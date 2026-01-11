import { useState, useEffect, useRef } from 'react';
import * as webllm from "@mlc-ai/web-llm";
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// Using a slightly faster model for the demo if possible, but sticking to your config
const LOCAL_MODEL = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

interface Message {
  role: 'user' | 'assistant' | 'system' | 'optimizer'; 
  content: string;
  // Optional metadata for the "Proof" display
  routingInfo?: {
    location: string;
    logic: string;
    waterSaved: number;
    isEstimate: boolean;
  };
}

interface DashboardStats {
  tokensSaved: number;
  waterFromTokens: number;
  waterFromCooling: number;
  totalWater: number;
}

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("Initializing...");
  const [isModelReady, setIsModelReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Track cumulative stats
  const [stats, setStats] = useState<DashboardStats>({
    tokensSaved: 0,
    waterFromTokens: 0,
    waterFromCooling: 0,
    totalWater: 0
  });

  const engineRef = useRef<webllm.MLCEngine | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setStatus("Loading local AI model (this may take a moment)...");
        const engine = await webllm.CreateMLCEngine(LOCAL_MODEL, {
          initProgressCallback: (progress) => { if (progress.text) setStatus(progress.text); },
        });
        engineRef.current = engine;
        setIsModelReady(true);
        setStatus("System Ready.");
      } catch (err) {
        console.error(err);
        setStatus("Error loading model.");
      }
    };
    loadModel();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const originalText = input;
    // Estimate tokens (roughly 1.3 chars per token)
    const originalTokens = Math.ceil(originalText.length / 4); 
    
    setInput("");
    setIsProcessing(true);
    // Add User Message
    setMessages(prev => [...prev, { role: "user", content: originalText }]);

    let promptToForward = originalText;
    let tokensSavedThisTurn = 0;

    try {
      // 1. Local Llama Optimization
      // We check if engine is ready. If not, we skip this step (but you should wait for "System Ready")
      if (engineRef.current) {
        setStatus("Optimizing prompt locally...");
        const shortenMsg: webllm.ChatCompletionMessageParam[] = [
          { role: "system", content: "You are an expert prompt engineer. Rewrite the user's prompt to be as concise as possible while keeping the core meaning. Do not answer the prompt, just rewrite it." },
          { role: "user", content: "I am working very hard to cook with steak that I just bought. Generate me a recipe." },
          { role: "assistant", content: "Recipe for steak." },
          { role: "user", content: originalText }
        ];

        const res = await engineRef.current.chat.completions.create({ messages: shortenMsg, temperature: 0.1 });
        const llamaOutput = res.choices[0]?.message?.content;
        
        // FORCE SHOW: If we got ANY output, we show the optimized bubble.
        if (llamaOutput && llamaOutput.length > 0) {
          promptToForward = llamaOutput;
          const newTokens = Math.ceil(promptToForward.length / 4);
          
          // Calculate savings (prevent negative numbers for UI)
          tokensSavedThisTurn = Math.max(0, originalTokens - newTokens);
          
          // ALWAYS add the optimization message for the demo
          setMessages(prev => [...prev, { 
            role: 'optimizer', 
            content: `⚡ Optimized: "${promptToForward}"` 
          }]);
        }
      }

      // 2. Send to Backend
      setStatus("Routing to coldest data center...");
      
      const apiRes = await axios.post('http://127.0.0.1:5000/generate', {
        prompt: promptToForward
      });

      const { response, routed_to, weather_logic, water_saved_ml, is_estimate } = apiRes.data;

      // Update Global Stats
      setStats(prev => ({
        tokensSaved: prev.tokensSaved + tokensSavedThisTurn,
        waterFromTokens: prev.waterFromTokens + (tokensSavedThisTurn * 5),
        waterFromCooling: prev.waterFromCooling + water_saved_ml,
        totalWater: prev.totalWater + (tokensSavedThisTurn * 5) + water_saved_ml
      }));

      // Add Assistant Message with Routing Proof
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response,
        routingInfo: {
            location: routed_to,
            logic: weather_logic,
            waterSaved: water_saved_ml,
            isEstimate: is_estimate
        }
      }]);
      
      setStatus("Ready.");
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "system", content: "Error: Could not reach the backend. Is main.py running?" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] text-gray-100 font-sans">
      
      {/* Header with Live Stats */}
      <header className="px-6 py-4 border-b border-gray-800 bg-[#161b22] flex justify-between items-center shadow-md shrink-0">
        <div>
          <h1 className="text-xl font-bold text-blue-400">🌊 Water Tracker</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{status}</p>
        </div>
        <div className="flex gap-6 text-xs font-mono bg-gray-900 p-3 rounded-lg border border-gray-700">
            <div>
                <span className="text-gray-400 block text-[10px]">TOKENS SAVED</span>
                <span className="text-green-400 font-bold text-lg">{stats.tokensSaved}</span>
            </div>
            <div className="border-l border-gray-700 pl-6">
                <span className="text-gray-400 block text-[10px]">TOTAL WATER SAVED</span>
                <span className="text-blue-400 font-bold text-lg">{stats.totalWater.toFixed(1)} mL</span>
            </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {messages.length === 0 && (
            <div className="text-center mt-32 text-gray-500">
              <p className="text-2xl font-semibold mb-2">How can I help you today?</p>
              <p className="text-sm">We route prompts to cold climates to save water.</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-xl ${
                m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 
                m.role === 'optimizer' ? 'bg-gradient-to-r from-purple-900/40 to-blue-900/40 text-purple-200 text-sm italic mb-2 border border-purple-500/30' : 
                m.role === 'system' ? 'bg-red-900/20 text-red-400 border border-red-500/20' :
                'bg-[#1e232e] text-gray-200 border border-gray-700 rounded-bl-none'
              }`}>
                
                {/* PROOF OF ROUTING (Only for Assistant) */}
                {m.routingInfo && (
                    <div className="mb-4 pb-3 border-b border-gray-700/50">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/30">
                                🌍 ROUTED TO: {m.routingInfo.location}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                m.routingInfo.isEstimate 
                                ? "bg-orange-500/20 text-orange-400 border-orange-500/30" 
                                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            }`}>
                                💧 -{m.routingInfo.waterSaved}mL {m.routingInfo.isEstimate && "(Est.)"}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-500 italic">
                            Logic: {m.routingInfo.logic}
                        </p>
                    </div>
                )}

                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </main>

      {/* Input Bar */}
      <footer className="p-4 bg-gradient-to-t from-[#0f1117] via-[#0f1117] to-transparent shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3 items-center bg-[#1e232e] p-2 rounded-2xl border border-gray-700 shadow-2xl focus-within:border-blue-500 transition-colors">
          <input 
            disabled={!isModelReady || isProcessing}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border-none px-4 py-3 text-gray-100 focus:outline-none placeholder-gray-500"
            placeholder={!isModelReady ? "Wait for model..." : "Type your message..."}
          />
          <button 
            onClick={handleSend}
            disabled={!isModelReady || isProcessing}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;