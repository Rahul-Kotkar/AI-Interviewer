"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInterviewStore } from "@/app/store/interviewStore";
import { useRouter } from "next/navigation";
import InterviewHeader from "@/components/session/InterviewHeader";
import SpeakerPanel from "@/components/session/SpeakerPanel";
import ControlButtons from "@/components/session/ControlButtons";

// --- PLACEHOLDER DATA FOR DIRECT TESTING/RELOADING ---
const MOCK_DATA = {
  interviewTitle: "Test Interview (Dev Mode)",
  interviewCategory: "Technical",
  questionOutline: [
    "First test question: Tell me about a project you're proud of.",
    "Second test question: What is a closure in JavaScript?",
    "Third test question: How would you handle a disagreement with a coworker?",
  ],
  resumeData: {
    name: "Test User",
    role: "Developer",
    sections: [],
  },
};

const MicIcon = () => (
  <svg
    className="w-8 h-8"
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"></path>
  </svg>
);

interface TranscriptItem {
  speaker: "AI" | "User";
  text: string;
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const latestAnswerRef = useRef("");
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false); // Prevent duplicate answer processing

  // --- LOAD VOICES ---
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log("Available voices:", voices); // Debug voices
      if (voices.length > 0) {
        setVoicesLoaded(true);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          const updatedVoices = window.speechSynthesis.getVoices();
          console.log("Voices changed:", updatedVoices); // Debug voices
          if (updatedVoices.length > 0) {
            setVoicesLoaded(true);
            window.speechSynthesis.onvoiceschanged = null;
          }
        };
      }
    };
    loadVoices();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // --- SPEAK: Enhanced with delay, retry, and voice check ---
  const speak = useCallback(
    (text: string, retryCount = 0) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        console.warn("SpeechSynthesis not supported");
        setIsSpeaking(false);
        handleListen(); // Proceed to maintain flow
        return;
      }
      if (!voicesLoaded) {
        console.warn("Voices not loaded, retrying...");
        if (retryCount < 3) {
          setTimeout(() => speak(text, retryCount + 1), 1000);
        } else {
          console.error("No voices available after retries, skipping speech");
          setIsSpeaking(false);
          handleListen();
        }
        return;
      }
      // Add delay to avoid rapid cancel/speak
      setTimeout(() => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onerror = (err) => {
          console.error(
            "Speech error:",
            err,
            "Text:",
            text,
            "Retry:",
            retryCount
          );
          setIsSpeaking(false);
          if (retryCount < 3) {
            console.warn("Retrying speech, attempt:", retryCount + 1);
            setTimeout(() => speak(text, retryCount + 1), 1000);
          } else {
            console.error("Speech failed after retries, skipping");
            handleListen();
          }
        };
        utterance.onstart = () => {
          stopListening();
          setIsSpeaking(true);
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          setTimeout(() => handleListen(), 500); // Delay mic start to avoid echo on Edge
        };
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          utterance.voice =
            voices.find((v) => v.lang.includes("en")) || voices[0]; // Prefer English voice
          console.log("Using voice:", utterance.voice); // Debug selected voice
        }
        window.speechSynthesis.speak(utterance);
      }, 100); // Small delay to stabilize
    },
    [voicesLoaded]
  );

  // --- USER ANSWER HANDLING ---
  const handleUserAnswer = useCallback(
    async (answer: string) => {
      if (isProcessingRef.current) {
        console.log("Skipping duplicate answer processing:", answer); // Debug
        return;
      }
      isProcessingRef.current = true;
      console.log("Sending to API:", answer); // Debug
      setTranscript((prev) => [...prev, { speaker: "User", text: answer }]);

      try {
        const res = await fetch("/api/process-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationHistory: [
              ...transcript,
              { speaker: "User", text: answer },
            ],
            userAnswer: answer,
            remainingQuestions,
          }),
        });

        const data = await res.json();

        if (!data || data.error) {
          throw new Error(data?.error || "Invalid AI response");
        }

        const aiResponse = data.next_question_text;
        console.log("Received API response:", aiResponse); // Debug
        setTranscript((prev) => [...prev, { speaker: "AI", text: aiResponse }]);
        speak(aiResponse);

        if (data.decision === "next-question") {
          setRemainingQuestions((prev) => prev.slice(1));
        }
      } catch (err) {
        console.error("Error processing answer:", err);
        const fallback = "Sorry, something went wrong. Let's move on.";
        setTranscript((prev) => [...prev, { speaker: "AI", text: fallback }]);
        speak(fallback);
        setRemainingQuestions((prev) => prev.slice(1));
      } finally {
        isProcessingRef.current = false; // Reset to allow next answer
      }
    },
    [remainingQuestions, speak, transcript]
  );

  // --- LISTENING CONTROLS ---
  const handleListen = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    if (recognitionRef.current) {
      if (isListening) {
        console.log("Aborting existing recognition before start"); // Debug
        recognitionRef.current.abort(); // Ensure stopped to avoid InvalidStateError
      }
      setTimeout(() => {
        console.log("Starting speech recognition"); // Debug
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error("Failed to start recognition:", err); // Debug
        }
      }, 100); // Small delay for Edge stability
    }
  };

  const stopListening = () => {
    if (isListening && recognitionRef.current) {
      console.log("stoplisten is called"); // Debug
      recognitionRef.current.stop();
      recognitionRef.current.abort(); // Immediate abort to force onend
      setIsListening(false);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    }
  };

  // --- SETUP RECOGNITION ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onstart = () => {
          console.log("Recognition started"); // Debug
          setIsListening(true);
        };

        recognitionRef.current.onend = () => {
          console.log(
            "Recognition onend triggered, answer:",
            latestAnswerRef.current
          ); // Debug
          setIsListening(false);
          if (latestAnswerRef.current.trim()) {
            console.log("Processing answer in onend:", latestAnswerRef.current); // Debug
            handleUserAnswer(latestAnswerRef.current.trim());
            latestAnswerRef.current = "";
            setUserAnswer("");
          }
          // No auto-restart; handled by speak's onend to avoid echo
        };

        recognitionRef.current.onresult = (event) => {
          console.log("Recognition result received"); // Debug
          let fullTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + " ";
          }
          const trimmedTranscript = fullTranscript.trim();
          if (trimmedTranscript) {
            setUserAnswer(trimmedTranscript);
            latestAnswerRef.current = trimmedTranscript;
            console.log("Current transcript:", trimmedTranscript); // Debug
            if (silenceTimeoutRef.current)
              clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => {
              console.log("Silence detected, stopping recognition"); // Debug
              stopListening();
            }, 3000); // 3s for Edge reliability
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Recognition error:", event.error || event); // Log specific error
          setIsListening(false);
          if (silenceTimeoutRef.current)
            clearTimeout(silenceTimeoutRef.current);
          if (event.error === "no-speech" || !event.error) {
            console.log(
              "No-speech or empty error, processing if answer exists"
            ); // Debug
            if (latestAnswerRef.current.trim()) {
              console.log(
                "Processing answer in onerror:",
                latestAnswerRef.current
              ); // Debug
              handleUserAnswer(latestAnswerRef.current.trim());
              latestAnswerRef.current = "";
              setUserAnswer("");
            }
            if (!isSpeaking) {
              console.log("Restarting recognition after no-speech"); // Debug
              setTimeout(() => handleListen(), 500); // Delay for Edge stability
            }
          } else {
            console.log("Aborting recognition on error:", event.error); // Debug
            recognitionRef.current.abort();
          }
        };
      } else {
        console.error("SpeechRecognition not supported");
      }
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      window.speechSynthesis.cancel();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [handleUserAnswer]);

  // --- INIT INTERVIEW ---
  useEffect(() => {
    if (!isStarted) return;
    if (!questionOutline || questionOutline.length === 0) {
      if (!isStoreEmpty) router.push("/");
      return;
    }

    const firstQuestion = questionOutline[0];
    setRemainingQuestions(questionOutline.slice(1));
    const greeting = `Hello ${resumeData?.name}, welcome to your ${interviewTitle}. Let's begin. ${firstQuestion}`;
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

  const getCurrentAiMessage = () => {
    const aiMessages = transcript.filter((item) => item.speaker === "AI");
    return aiMessages[aiMessages.length - 1]?.text || "Preparing interview...";
  };

  const handleRepeat = () => {
    if (isSpeaking) return;
    speak(getCurrentAiMessage());
  };

  const handleLeave = () => {
    if (recognitionRef.current) recognitionRef.current.abort();
    window.speechSynthesis.cancel();
    router.push("/feedback");
  };

  return (
    <div className="bg-[#121212] text-white min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
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
              <span className="bg-gray-700 text-sm font-medium px-3 py-1 rounded-full mt-2 inline-block">
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
                {isListening ? userAnswer || "..." : getCurrentAiMessage()}
              </p>
            </section>

            <ControlButtons
              isSpeaking={isSpeaking}
              isListening={isListening}
              handleRepeat={handleRepeat}
              handleLeave={handleLeave}
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
