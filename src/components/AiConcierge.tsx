import React, { useState, useRef, useEffect } from 'react';
import { CarModel, CarColor, WheelOption } from './types';
import { Sparkles, MessageSquare, Send, Trash2, ArrowRight, ShieldCheck, HelpCircle, Loader2, Mic, MicOff } from 'lucide-react';

interface AiConciergeProps {
  selectedCar: CarModel;
  selectedColor: CarColor;
  selectedWheel: WheelOption;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function AiConcierge({ selectedCar, selectedColor, selectedWheel }: AiConciergeProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up any ongoing vocal session on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore already stopped recognition
        }
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) {
      setErrorMsg('Speech recognition is not supported in this browser environment. Please try Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setErrorMsg(null);
      try {
        const rec = new SpeechRecognitionImpl();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputVal(prev => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${transcript}` : transcript;
            });
          }
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error event:', event);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setErrorMsg('Microphone access was denied. Please grant permission in your browser to speak to Mercedes Intelligence.');
          } else {
            setErrorMsg(`Microphone error: ${event.error || 'Unable to recognize speech'}`);
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.error('Failed to start speech recognition engine:', err);
        setIsListening(false);
      }
    }
  };

  // Dynamic suggestion prompt options depending on the active vehicle model
  const suggestionsMap: Record<string, string[]> = {
    amg_gt: [
      "What makes the hand-built AMG 4.0L V8 Biturbo engine unique?",
      "How does the active aerodynamics system optimize high-speed control?",
      "Explain the performance difference of AMG RIDE CONTROL sport suspension."
    ],
    eqs: [
      "How does the 56-inch MBUX Hyperscreen interface operate?",
      "What luxury acoustic soundscapes enhance the EQS's interior silence?",
      "Explain the physical response of the 10-degree rear-axle steering."
    ],
    g_wagon: [
      "Explain the mechanical logic of the G 63's Three Differential Locks.",
      "How is the rigid passenger cell frame built for ultimate off-road durability?",
      "What is the acoustic design behind the AMG dual sidepipe exhausts?"
    ]
  };

  const defaultSuggestions = [
    "What is the core philosophy behind Mercedes-Benz 'The Best or Nothing'?",
    "Tell me about the engineering history of AMG Performance from Affalterbach.",
    "Which current Mercedes-Benz vehicles are built at the Sindelfingen factory?"
  ];

  const activeSuggestions = suggestionsMap[selectedCar.id] || defaultSuggestions;

  useEffect(() => {
    // Scroll chat bottom smoothly on new message or loading state, only if we have more than the initial message
    if (messages.length > 1 || isLoading) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isLoading]);

  // Initial greeting when selectedCar changes, introducing the custom luxury AI persona
  useEffect(() => {
    setMessages([
      {
        id: 'initial-greet',
        role: 'assistant',
        text: `Welcome to the Mercedes-Benz Digital Atelier. I am your personal Mercedes Intelligence.\n\nYou are currently exploring the **${selectedCar.name}** finished in custom **${selectedColor.name}** Paint on premium **${selectedWheel.name}**.\n\nAsk me anything about its handcrafted mechanical specs, track-bred racing dynamics, state-of-the-art aero systems, or any other detail of Stuttgart's excellence. How can I assist your showroom experience today?`,
        timestamp: new Date()
      }
    ]);
    setErrorMsg(null);
  }, [selectedCar, selectedColor, selectedWheel]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Assemble the message history for multi-turn conversational memory
      // Exclude initial-greet to prevent repeating the greeting structure, or include it cleanly
      const chatHistory = messages
        .filter(m => m.id !== 'initial-greet')
        .concat(userMsg)
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          text: m.text
        }));

      // Make the server-side API call
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          carModel: selectedCar,
          selectedColor,
          selectedWheel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to retrieve information from our Stuttgart Concierge pipeline.");
      }

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.text || "I was unable to formulate a response at this moment. Please rephrase your query.",
        timestamp: new Date()
      }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected network disruption occurred while communicating with our Stuttgart servers.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'initial-greet',
        role: 'assistant',
        text: `Mercedes Intelligence system rebooted.\n\nHow can I aid your dynamic review of the custom **${selectedCar.name}** with **${selectedColor.name}** paint config?`,
        timestamp: new Date()
      }
    ]);
    setErrorMsg(null);
  };

  return (
    <div id="atelier-ai-concierge-panel" className="bg-white/5 border border-white/10 p-8 backdrop-blur-xl rounded-none shadow-[0_24px_50px_rgba(0,0,0,0.6)] flex flex-col gap-6 scroll-mt-24">
      {/* Header and Controls block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-light text-white tracking-tight uppercase flex items-center gap-3">
            <span>Mercedes Intelligence</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/25 bg-white/10 flex items-center justify-center p-0.5 shadow-[0_0_15px_rgba(255,255,255,0.15)] shrink-0 transition-transform hover:scale-110 duration-300">
              <img 
                src="https://jooinn.com/images/mercedes-logo-2.jpg" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Benz_logo_2010.svg/256px-Mercedes-Benz_logo_2010.svg.png";
                }}
                alt="Mercedes-Benz Logo"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Suggested Queries Spec Deck */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono tracking-[0.2em] text-white/50 uppercase">FAQ</span>
            <p className="text-xs text-gray-400 font-light italic leading-normal">
              Accelerate your knowledge with technical questions optimized for the active **{selectedCar.name}** configuration.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {activeSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSend(suggestion)}
                className="text-left text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 p-4 transition-all flex items-start gap-3 cursor-pointer group rounded-none"
                disabled={isLoading}
              >
                <HelpCircle className="w-4 h-4 text-white/40 mt-0.5 group-hover:text-white transition-colors flex-shrink-0" />
                <span className="font-light leading-relaxed">{suggestion}</span>
              </button>
            ))}
          </div>


        </div>

        {/* Multi-turn Chat Thread Board */}
        <div className="lg:col-span-8 bg-black/40 border border-white/10 flex flex-col h-[460px] relative rounded-none">
          {/* Chat Messages Log view container */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1.5 font-mono text-[9px] tracking-wider uppercase text-white/40">
                  <span>{m.role === 'user' ? 'CLIENT' : 'MERCEDES INTELLIGENCE'}</span>
                  <span>•</span>
                  <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <div 
                  className={`p-4 text-xs font-light leading-relaxed whitespace-pre-wrap rounded-none border ${
                    m.role === 'user' 
                      ? 'bg-white text-black border-white' 
                      : 'bg-white/5 text-gray-200 border-white/10'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="self-start flex flex-col items-start max-w-[80%] animate-pulse">
                <div className="flex items-center gap-2 mb-1.5 font-mono text-[9px] tracking-wider text-white/40">
                  <span>MERCEDES INTELLIGENCE IS FORMULATING DATA</span>
                  <Loader2 className="w-3 h-3 animate-spin text-white/60" />
                </div>
                <div className="p-4 text-xs bg-white/5 text-gray-400 border border-white/10 flex items-center gap-2.5">
                  <span>Connecting to Stuttgart servers...</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="self-center bg-red-500/10 border border-red-500/20 text-red-400 p-4 font-mono text-xs text-center w-full max-w-md my-2">
                {errorMsg}
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

           {/* Interactive Chat Input Area */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            className="border-t border-white/10 p-4 bg-black/60 flex items-center gap-3"
          >
            <button
              type="button"
              onClick={toggleListening}
              className={`h-11 w-11 border flex items-center justify-center cursor-pointer transition-all relative ${
                isListening 
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                  : 'bg-white/5 text-white/60 border-white/15 hover:bg-white/10 hover:text-white'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak to Mercedes Intelligence'}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 z-10" />
                  <span className="absolute inset-0 bg-red-500/10 animate-ping rounded-none" />
                </>
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={isListening ? "Listening... Speak now..." : "Ask about dynamic launch control, luxury aesthetics..."}
              className={`flex-1 bg-white/5 text-xs text-white border px-4 h-11 focus:outline-none focus:ring-0 placeholder-white/30 rounded-none font-sans font-light transition-all ${
                isListening 
                  ? 'border-red-500/40 focus:border-red-500/60 bg-red-950/5'
                  : 'border-white/15 focus:border-white focus:border-white/30'
              }`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className={`h-11 px-5 border flex items-center justify-center cursor-pointer transition-all ${
                inputVal.trim() && !isLoading
                  ? 'bg-white text-black border-white hover:bg-neutral-200'
                  : 'bg-transparent text-white/20 border-white/10 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
