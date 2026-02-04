import { useState } from "react";

export default function ChatbotWithVoice() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState("en-US"); // 🌍 language state

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

  // 🔁 Send text to chatbot backend
  const sendMessage = async (message) => {
    if (!message.trim()) return;

    try {
      const res = await fetch("http://localhost:5000/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          lang // 👈 send selected language
        })
      });

      if (!res.ok) {
        setReply(getErrorMessage("serverError"));
        return;
      }

      const data = await res.json();
      setReply(data.reply);
      speak(data.reply);

    } catch (error) {
      console.error("Chatbot request failed:", error);
      setReply(getErrorMessage("connectionError"));
    }
  };

  // 🎤 Voice → Text
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(getErrorMessage("speechNotSupported"));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang; // 🌍 use selected language
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

    recognition.start();
  };

  // 🔊 Text → Voice
  const speak = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // prevent overlap

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang; // 🌍 speak in same language
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px" }}>
      <h2>Inventory Chatbot</h2>

      {/* 🌍 Language Selector */}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        style={{ marginBottom: "10px", width: "100%" }}
      >
        <option value="en-US">English</option>
        <option value="hi-IN">Hindi</option>
        <option value="mr-IN">Marathi</option>
        <option value="ta-IN">Tamil</option>
        <option value="te-IN">Telugu</option>
      </select>

      <input
        type="text"
        value={input}
        placeholder="Type or speak..."
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendMessage(input);
        }}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <button onClick={() => sendMessage(input)} style={{ marginRight: "10px" }}>
        Send
      </button>

      <button onClick={startListening}>
        {listening ? "Listening..." : "🎤 Speak"}
      </button>

      <p style={{ marginTop: "20px" }}>
        <strong>Bot:</strong> {reply}
      </p>
    </div>
  );
}
