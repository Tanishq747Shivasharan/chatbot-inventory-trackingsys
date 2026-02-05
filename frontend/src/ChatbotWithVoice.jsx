import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import "./ChatbotWithVoice.css";

export default function ChatbotWithVoice() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState("en-US");
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationState, setAnimationState] = useState("idle");

  // Refs for GSAP animations
  const orbContainerRef = useRef(null);
  const overlayRef = useRef(null);
  const chatInterfaceRef = useRef(null);
  const outerRingRef = useRef(null);
  const middleRingRef = useRef(null);
  const innerRingRef = useRef(null);
  const coreRef = useRef(null);
  const glowRef = useRef(null);
  const messagesEndRef = useRef(null);
  const segmentedRingRef = useRef(null);
  const particlesRef = useRef([]);
  const messageRefs = useRef([]);

  // Animation timelines refs
  const idleAnimationsRef = useRef([]);

  // Language-aware error messages
  const getErrorMessage = (type) => {
    const messages = {
      "en-US": {
        serverError: "Server error. Please try again.",
        connectionError: "Unable to connect to server.",
        speechNotSupported: "Speech recognition is not supported in this browser."
      },
      "hi-IN": {
        serverError: "सर्वर एरर। कृपया फिर से कोशिश करें।",
        connectionError: "सर्वर से कनेक्ट नहीं हो पा रहा।",
        speechNotSupported: "इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है।"
      },
      "mr-IN": {
        serverError: "सर्व्हर एरर। कृपया पुन्हा प्रयत्न करा।",
        connectionError: "सर्व्हरशी कनेक्ट होऊ शकत नाही।",
        speechNotSupported: "या ब्राउझरमध्ये स्पीच रिकग्निशन समर्थित नाही।"
      },
      "ta-IN": {
        serverError: "சர்வர் பிழை. மீண்டும் முயற்சிக்கவும்.",
        connectionError: "சர்வருடன் இணைக்க முடியவில்லை.",
        speechNotSupported: "இந்த பிரவுசரில் பேச்சு அங்கீகாரம் ஆதரிக்கப்படவில்லை."
      },
      "te-IN": {
        serverError: "సర్వర్ ఎర్రర్. దయచేసి మళ్లీ ప్రయత్నించండి.",
        connectionError: "సర్వర్‌తో కనెక్ట్ చేయలేకపోయాము.",
        speechNotSupported: "ఈ బ్రౌజర్‌లో స్పీచ్ రికగ్నిషన్ మద్దతు లేదు."
      }
    };
    
    return messages[lang]?.[type] || messages["en-US"][type];
  };

  // Animation configurations based on state
  const animationConfigs = {
    idle: {
      rotationSpeed: 20,
      pulseIntensity: 1.03,
      glowOpacity: 0.6
    },
    listening: {
      rotationSpeed: 10,
      pulseIntensity: 1.1,
      glowOpacity: 1.0,
      ripple: true
    },
    speaking: {
      rotationSpeed: 15,
      pulseIntensity: 1.1,
      glowOpacity: 0.9
    },
    processing: {
      rotationSpeed: 5,
      pulseIntensity: 1.05,
      glowOpacity: 0.7
    }
  };

  // Dynamic glow update based on intensity
  const updateGlow = (intensity) => {
    if (glowRef.current) {
      const glowSize = 20 + intensity * 30;
      const glowOpacity = 0.5 + intensity * 0.4;
      gsap.to(glowRef.current, {
        filter: `drop-shadow(0 0 ${glowSize}px rgba(0, 255, 255, ${glowOpacity}))`,
        duration: 0.5,
        ease: "power2.out"
      });
    }
  };

  // Data pulse animation when message received
  const animateDataPulse = () => {
    if (coreRef.current) {
      gsap.fromTo(
        coreRef.current,
        { scale: 1 },
        {
          scale: 1.2,
          duration: 0.4,
          ease: "back.out(1.7)",
          yoyo: true,
          repeat: 1
        }
      );
    }
  };

  // Apply animation state
  const applyAnimationState = (state) => {
    const config = animationConfigs[state];
    if (!config) return;

    if (outerRingRef.current) {
      gsap.to(outerRingRef.current, {
        rotation: 360,
        duration: config.rotationSpeed,
        ease: "none",
        repeat: -1
      });
    }

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: config.glowOpacity,
        duration: 0.5
      });
    }

    if (coreRef.current) {
      gsap.to(coreRef.current, {
        scale: config.pulseIntensity,
        duration: 2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });
    }
  };

  // Initialize particle system
  useEffect(() => {
    if (isExpanded && particlesRef.current.length > 0) {
      particlesRef.current.forEach((particle, i) => {
        if (particle) {
          gsap.to(particle, {
            x: `random(-50, 50)`,
            y: `random(-50, 50)`,
            opacity: `random(0.2, 0.8)`,
            duration: `random(2, 4)`,
            repeat: -1,
            yoyo: true,
            delay: i * 0.1,
            ease: "sine.inOut"
          });
        }
      });
    }
  }, [isExpanded]);

  // Initialize idle animations
  useEffect(() => {
    if (!isExpanded && outerRingRef.current && middleRingRef.current && innerRingRef.current && coreRef.current && glowRef.current) {
      // Kill any existing animations
      idleAnimationsRef.current.forEach(anim => anim.kill());
      idleAnimationsRef.current = [];

      // Idle state animations
      idleAnimationsRef.current.push(
        gsap.to(outerRingRef.current, {
          rotation: 360,
          duration: 20,
          ease: "none",
          repeat: -1
        })
      );

      idleAnimationsRef.current.push(
        gsap.to(middleRingRef.current, {
          rotation: -360,
          duration: 16,
          ease: "none",
          repeat: -1
        })
      );

      idleAnimationsRef.current.push(
        gsap.to(innerRingRef.current, {
          rotation: 360,
          duration: 25,
          ease: "none",
          repeat: -1
        })
      );

      // Breathing pulse
      idleAnimationsRef.current.push(
        gsap.to(coreRef.current, {
          scale: 1.03,
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        })
      );

      idleAnimationsRef.current.push(
        gsap.to(glowRef.current, {
          opacity: 0.8,
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        })
      );

      // Animate segmented ring
      if (segmentedRingRef.current && segmentedRingRef.current.children) {
        idleAnimationsRef.current.push(
          gsap.to(segmentedRingRef.current.children, {
            opacity: 0.2,
            duration: 0.5,
            stagger: {
              each: 0.05,
              repeat: -1,
              yoyo: true
            }
          })
        );
      }
    }

    return () => {
      // Cleanup animations when component unmounts
      idleAnimationsRef.current.forEach(anim => anim.kill());
    };
  }, [isExpanded]);

  // Listening state animation
  useEffect(() => {
    if (listening) {
      setAnimationState("listening");
      applyAnimationState("listening");
      updateGlow(1);

      if (outerRingRef.current) {
        gsap.to(outerRingRef.current, {
          rotation: "+=360",
          duration: 10,
          ease: "none",
          repeat: -1
        });
      }
    } else if (animationState === "listening") {
      setAnimationState("idle");
      applyAnimationState("idle");
      updateGlow(0);
    }
  }, [listening]);

  // Speaking state animation
  useEffect(() => {
    if (speaking) {
      setAnimationState("speaking");
      applyAnimationState("speaking");
      updateGlow(0.5);

      if (coreRef.current) {
        gsap.to(coreRef.current, {
          scale: 1.1,
          duration: 0.3,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true
        });
      }
    } else if (animationState === "speaking") {
      setAnimationState("idle");
      applyAnimationState("idle");
      updateGlow(0);
    }
  }, [speaking]);

  // Animate new messages with stagger
  useEffect(() => {
    if (messages.length > 0) {
      animateDataPulse();
      
      // Animate the latest message
      const latestIndex = messages.length - 1;
      if (messageRefs.current[latestIndex]) {
        gsap.fromTo(
          messageRefs.current[latestIndex],
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.5)"
          }
        );
      }
    }
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Button press effect
  const buttonPressEffect = (buttonRef) => {
    if (buttonRef && buttonRef.current) {
      gsap.timeline()
        .to(buttonRef.current, {
          scale: 0.95,
          duration: 0.1
        })
        .to(buttonRef.current, {
          scale: 1.05,
          duration: 0.15
        })
        .to(buttonRef.current, {
          scale: 1,
          duration: 0.1
        });
    }
  };

  // Expand/Collapse animation
  const toggleExpand = () => {
    if (!isExpanded) {
      // Expand animation
      setIsExpanded(true);

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" }
      });

      tl.set([overlayRef.current, chatInterfaceRef.current], {
        pointerEvents: "all"
      })
      .to(overlayRef.current, {
        opacity: 1,
        duration: 0.4
      })
      .to(
        orbContainerRef.current,
        {
          x: window.innerWidth / 2 - orbContainerRef.current.offsetLeft - 40,
          y: -(window.innerHeight / 2 + orbContainerRef.current.offsetTop - 25),
          scale: 1.2,
          duration: 0.3
        },
        0
      )
      .to(
        orbContainerRef.current,
        {
          scale: 8,
          duration: 0.6
        },
        0.2
      )
      .to(
        chatInterfaceRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.5
        },
        0.5
      );
    } else {
      // Collapse animation
      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          gsap.set([overlayRef.current, chatInterfaceRef.current], {
            pointerEvents: "none"
          });
        }
      });

      tl.to(chatInterfaceRef.current, {
        opacity: 0,
        y: 50,
        duration: 0.3,
        ease: "power3.in"
      })
      .to(
        orbContainerRef.current,
        {
          scale: 1.2,
          duration: 0.3
        },
        0.1
      )
      .to(
        orbContainerRef.current,
        {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.6
        },
        0.3
      )
      .to(
        overlayRef.current,
        {
          opacity: 0,
          duration: 0.4
        },
        0.2
      );

      setIsExpanded(false);
    }
  };

  // Send message to backend
  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { type: "user", text: message }]);
    setInput("");

    // Set processing state
    setAnimationState("processing");
    applyAnimationState("processing");

    try {
      const res = await fetch("http://localhost:5000/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          lang
        })
      });

      if (!res.ok) {
        const errorMsg = getErrorMessage("serverError");
        setMessages((prev) => [...prev, { type: "bot", text: errorMsg }]);
        setAnimationState("idle");
        applyAnimationState("idle");
        return;
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { type: "bot", text: data.reply }]);
      speak(data.reply);
      
      // Return to idle after processing
      setAnimationState("idle");
      applyAnimationState("idle");

    } catch (error) {
      console.error("Chatbot request failed:", error);
      const errorMsg = getErrorMessage("connectionError");
      setMessages((prev) => [...prev, { type: "bot", text: errorMsg }]);
      setAnimationState("idle");
      applyAnimationState("idle");
    }
  };

  // Voice → Text
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(getErrorMessage("speechNotSupported"));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;

    setListening(true);

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setInput(spokenText);
      setListening(false);
      sendMessage(spokenText);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  // Text → Voice
  const speak = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;

    setSpeaking(true);

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Full-screen overlay */}
      <div 
        ref={overlayRef} 
        className="overlay" 
        onClick={(e) => {
          if (e.target === overlayRef.current) {
            toggleExpand();
          }
        }} 
      />

      {/* Floating Orb */}
      <div 
        ref={orbContainerRef} 
        className={`orb-container ${isExpanded ? 'expanded' : ''}`}
        onClick={!isExpanded ? toggleExpand : undefined}
        style={{ 
          pointerEvents: isExpanded ? 'none' : 'all',
          cursor: isExpanded ? 'default' : 'pointer'
        }}
      >
        <svg className="orb-svg" viewBox="0 0 200 200">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="coreGradient">
              <stop offset="0%" stopColor="#00ffff" />
              <stop offset="100%" stopColor="#00ccff" />
            </radialGradient>
            <linearGradient id="animatedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ffff">
                <animate
                  attributeName="stop-color"
                  values="#00ffff; #00ff88; #00ffff"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#00ff88">
                <animate
                  attributeName="stop-color"
                  values="#00ff88; #00ffff; #00ff88"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>

          {/* Glow layer */}
          <g ref={glowRef}>
            <circle
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke="url(#animatedGradient)"
              strokeWidth="2"
              opacity="0.3"
              filter="url(#glow)"
            />
          </g>

          {/* Segmented ring */}
          <g ref={segmentedRingRef}>
            {[...Array(12)].map((_, i) => (
              <line
                key={i}
                x1="100"
                y1="15"
                x2="100"
                y2="5"
                stroke="#00ffff"
                strokeWidth="2"
                transform={`rotate(${i * 30} 100 100)`}
                opacity="0.6"
              />
            ))}
          </g>

          {/* Outer ring */}
          <g ref={outerRingRef}>
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="#00ff88"
              strokeWidth="2"
              strokeDasharray="10 15"
              opacity="0.6"
            />
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#00ffff"
              strokeWidth="1"
              strokeDasharray="5 10"
              opacity="0.4"
            />
          </g>

          {/* Middle ring */}
          <g ref={middleRingRef}>
            <circle
              cx="100"
              cy="100"
              r="65"
              fill="none"
              stroke="url(#animatedGradient)"
              strokeWidth="3"
              strokeDasharray="20 10"
              opacity="0.7"
            />
            <circle
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke="#00ff88"
              strokeWidth="1"
              strokeDasharray="3 7"
              opacity="0.5"
            />
          </g>

          {/* Inner ring */}
          <g ref={innerRingRef}>
            <circle
              cx="100"
              cy="100"
              r="45"
              fill="none"
              stroke="#00ccff"
              strokeWidth="2"
              strokeDasharray="8 12"
              opacity="0.8"
            />
          </g>

          {/* Core */}
          <g ref={coreRef}>
            <circle
              cx="100"
              cy="100"
              r="30"
              fill="url(#coreGradient)"
              opacity="0.9"
              filter="url(#glow)"
            />
            <circle
              cx="100"
              cy="100"
              r="25"
              fill="#00ffff"
              opacity="0.6"
            />
          </g>

          {/* Ripple for listening state */}
          {listening && (
            <>
              <circle
                className="ripple"
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#00ffff"
                strokeWidth="2"
                opacity="0.6"
              >
                <animate
                  attributeName="r"
                  from="70"
                  to="95"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                className="ripple"
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#00ff88"
                strokeWidth="2"
                opacity="0.4"
              >
                <animate
                  attributeName="r"
                  from="70"
                  to="95"
                  dur="1.5s"
                  begin="0.75s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.4"
                  to="0"
                  dur="1.5s"
                  begin="0.75s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </svg>
      </div>

      {/* Chat Interface */}
      <div 
        ref={chatInterfaceRef} 
        className={`chat-interface ${isExpanded ? 'active' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="chat-container">
          {/* Header */}
          <div className="chat-header">
            <div className="header-content">
              <h2 className="chat-title">INVENTORY AI ASSISTANT</h2>
              <button className="close-btn" onClick={toggleExpand}>
                ✕
              </button>
            </div>

            {/* Language Selector */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="language-selector"
            >
              <option value="en-US">English</option>
              <option value="hi-IN">हिंदी</option>
              <option value="mr-IN">मराठी</option>
              <option value="ta-IN">தமிழ்</option>
              <option value="te-IN">తెలుగు</option>
            </select>
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <p>👋 Welcome to Inventory AI</p>
                <p className="subtitle">Ask me anything about your inventory</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  ref={el => messageRefs.current[idx] = el}
                  className={`message ${msg.type === "user" ? "user-message" : "bot-message"}`}
                >
                  <div className="message-bubble">
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-area">
            <input
              type="text"
              value={input}
              placeholder="Type or speak..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              className="message-input"
            />
            <button
              onClick={startListening}
              className={`mic-btn ${listening ? "listening" : ""}`}
              disabled={listening}
              title="Click to speak"
            >
              {listening ? "🎤" : "🎙️"}
            </button>
            <button 
              onClick={() => sendMessage(input)} 
              className="send-btn"
              disabled={!input.trim()}
              title="Send message"
            >
              ➤
            </button>
          </div>
        </div>

        {/* Animated Orb Background */}
        <div className="orb-background">
          {/* Particle system */}
          <div className="particle-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                ref={el => particlesRef.current[i] = el}
                className="particle"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${30 + Math.random() * 40}%`
                }}
              />
            ))}
          </div>

          <svg className="orb-bg-svg" viewBox="0 0 500 500">
            <defs>
              <filter id="bgGlow">
                <feGaussianBlur stdDeviation="15" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Large animated rings */}
            <circle
              cx="250"
              cy="250"
              r="220"
              fill="none"
              stroke="url(#animatedGradient)"
              strokeWidth="3"
              strokeDasharray="15 25"
              opacity="0.3"
              filter="url(#bgGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 250 250"
                to="360 250 250"
                dur="30s"
                repeatCount="indefinite"
              />
            </circle>

            <circle
              cx="250"
              cy="250"
              r="180"
              fill="none"
              stroke="#00ffff"
              strokeWidth="4"
              strokeDasharray="30 15"
              opacity="0.4"
              filter="url(#bgGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="360 250 250"
                to="0 250 250"
                dur="25s"
                repeatCount="indefinite"
              />
            </circle>

            <circle
              cx="250"
              cy="250"
              r="140"
              fill="none"
              stroke="#00ccff"
              strokeWidth="3"
              strokeDasharray="10 20"
              opacity="0.5"
              filter="url(#bgGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 250 250"
                to="360 250 250"
                dur="35s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Core glow */}
            <circle
              cx="250"
              cy="250"
              r="80"
              fill="url(#coreGradient)"
              opacity="0.2"
              filter="url(#bgGlow)"
            />
          </svg>
        </div>
      </div>
    </>
  );
}