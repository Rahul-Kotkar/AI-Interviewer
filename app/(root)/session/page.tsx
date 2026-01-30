"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInterviewStore } from "@/app/store/interviewStore";
import { useRouter } from "next/navigation";
import InterviewHeader from "@/components/session/InterviewHeader";
import SpeakerPanel from "@/components/session/SpeakerPanel";
import ControlButtons from "@/components/session/ControlButtons";

const MOCK_DATA = {
  interviewTitle: "Test Interview (Dev Mode)",
  interviewCategory: "Technical",
  questionOutline: [
    "To get started, could you briefly introduce yourself and share what motivated you to become a software developer?",
    "Thanks for that. You mentioned your motivation — can you walk me through one project that you’re most proud of, and what your specific contribution was?",
    "That’s interesting. What kind of challenges did you face during that project, and how did you overcome them?",
    "Since that project involved teamwork, how do you usually collaborate with teammates, especially when opinions differ?",
    "Good. Let’s talk about technical skills — can you explain in simple terms what a closure is in JavaScript, and why it might be useful?",
    "Nice explanation. Now imagine you’re working on a large codebase — how would you ensure your code remains clean, readable, and maintainable?",
    "Speaking of scale, have you ever optimized an application for performance? What strategies did you use?",
    "Let’s shift a bit — how do you usually approach learning a new technology or framework?",
    "Great. Suppose your manager suddenly changes the project requirements close to the deadline. How would you handle that situation?",
    "Finally, what are your long-term career goals as a software developer, and how do you see yourself growing in this role?",
  ],
  resumeData: {
    name: "Test User",
    role: "Developer",
    sections: [],
  },
};

interface TranscriptItem {
  speaker: "AI" | "User";
  text: string;
}

interface QAItem {
  question: string;
  answer: string;
}

export default function SessionPage() {
  const router = useRouter();
  const {
    interviewTitle: realTitle,
    interviewCategory: realCategory,
    questionOutline: realOutline,
    resumeData: realResumeData,
  } = useInterviewStore();

  const isStoreEmpty = !realTitle;
  const interviewTitle = isStoreEmpty ? MOCK_DATA.interviewTitle : realTitle;
  const interviewCategory = isStoreEmpty
    ? MOCK_DATA.interviewCategory
    : realCategory;
  const questionOutline = isStoreEmpty
    ? MOCK_DATA.questionOutline
    : realOutline;
  const resumeData = isStoreEmpty ? MOCK_DATA.resumeData : realResumeData;

  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [qaData, setQaData] = useState<QAItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const latestAnswerRef = useRef("");
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- LOAD VOICES ---
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          if (window.speechSynthesis.getVoices().length > 0) {
            setVoicesLoaded(true);
            window.speechSynthesis.onvoiceschanged = null;
          }
        };
      }
    };
    loadVoices();
  }, []);

  // --- SPEAK ---
  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onstart = () => {
        stopListening();
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setTimeout(() => handleListen(), 500);
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice =
          voices.find((v) => v.lang.includes("en")) || voices[0];
      }
      window.speechSynthesis.speak(utterance);
    },
    [voicesLoaded]
  );

  // --- HANDLE USER ANSWER ---
  const handleUserAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return;
      setTranscript((prev) => [...prev, { speaker: "User", text: answer }]);
      setQaData((prev) => [...prev, { question: currentQuestion, answer }]);

      if (remainingQuestions.length > 0) {
        const nextQ = remainingQuestions[0];
        setCurrentQuestion(nextQ);
        setRemainingQuestions((prev) => prev.slice(1));
        setTranscript((prev) => [...prev, { speaker: "AI", text: nextQ }]);
        speak(nextQ);
      } else {
        // ✅ Save final data before redirect
        try {
          localStorage.setItem(
            "qaData",
            JSON.stringify([...qaData, { question: currentQuestion, answer }])
          );
        } catch (err) {
          console.error("Failed to save qaData:", err);
        }
        router.push("/feedback");
      }
    },
    [currentQuestion, remainingQuestions, speak, router, qaData]
  );

  // --- LISTENING ---
  const handleListen = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch {}
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current.abort();
      setIsListening(false);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    }
  };

  // --- INIT RECOGNITION ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onstart = () => setIsListening(true);

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (latestAnswerRef.current.trim()) {
        handleUserAnswer(latestAnswerRef.current.trim());
        latestAnswerRef.current = "";
        setUserAnswer("");
      }
    };

    recognitionRef.current.onresult = (event: any) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + " ";
      }
      const trimmed = fullTranscript.trim();
      if (trimmed) {
        setUserAnswer(trimmed);
        latestAnswerRef.current = trimmed;
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          stopListening();
        }, 2000);
      }
    };
  }, [handleUserAnswer]);

  // --- START INTERVIEW ---
  useEffect(() => {
    if (!isStarted) return;
    if (!questionOutline || questionOutline.length === 0) {
      if (!isStoreEmpty) router.push("/");
      return;
    }
    const firstQ = questionOutline[0];
    setCurrentQuestion(firstQ);
    setRemainingQuestions(questionOutline.slice(1));
    const greeting = `Hello ${
      resumeData?.name || "Candidate"
    }, welcome to your ${interviewTitle}. Let's begin. ${firstQ}`;
    setTranscript([{ speaker: "AI", text: greeting }]);
    speak(greeting);
  }, [
    isStarted,
    questionOutline,
    resumeData,
    interviewTitle,
    isStoreEmpty,
    router,
    speak,
  ]);

  return (
    <div className="bg-[#121212] text-white min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        {!isStarted ? (
          <button
            onClick={() => setIsStarted(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4"
          >
            Start Interview
          </button>
        ) : (
          <>
            <InterviewHeader />
            <div className="w-full mb-8">
              <h1 className="text-3xl font-bold">{interviewTitle}</h1>
              <span className="bg-gray-700 text-sm px-3 py-1 rounded-full mt-2 inline-block">
                {interviewCategory}
              </span>
            </div>
            <main className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <SpeakerPanel
                type="AI"
                name="AI Interviewer"
                isActive={isSpeaking}
              />
              <SpeakerPanel
                type="User"
                name={resumeData?.name || "User"}
                isActive={isListening}
              />
            </main>
            <section className="bg-[#1F2937] p-6 rounded-2xl text-center mb-6 min-h-[80px] flex items-center justify-center">
              <p className="text-xl text-gray-300">
                {isListening
                  ? userAnswer || "..."
                  : transcript[transcript.length - 1]?.text}
              </p>
            </section>
            <ControlButtons
              isSpeaking={isSpeaking}
              isListening={isListening}
              handleRepeat={() =>
                speak(transcript[transcript.length - 1]?.text || "")
              }
              handleLeave={() => {
                try {
                  localStorage.setItem("qaData", JSON.stringify(qaData));
                } catch {}
                router.push("/feedback");
              }}
              handleListen={handleListen}
              stopListening={stopListening}
              disableMic={isSpeaking || isListening}
            />
          </>
        )}
      </div>
    </div>
  );
}
