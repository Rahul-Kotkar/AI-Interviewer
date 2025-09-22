"use client";

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

interface ControlButtonsProps {
  isSpeaking: boolean;
  isListening: boolean;
  handleRepeat: () => void;
  handleLeave: () => void;
  handleListen: () => void;
  stopListening: () => void;
}

export default function ControlButtons({
  isSpeaking,
  isListening,
  handleRepeat,
  handleLeave,
  handleListen,
  stopListening,
}: ControlButtonsProps) {
  return (
    <footer className="flex justify-center items-center gap-6">
      <button
        onClick={handleRepeat}
        disabled={isSpeaking || isListening}
        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Repeat
      </button>
      <button
        onClick={isListening ? stopListening : handleListen}
        disabled={isSpeaking}
        className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 ${
          isListening ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <MicIcon />
      </button>
      <button
        onClick={handleLeave}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-full transition-colors"
      >
        Leave Interview
      </button>
    </footer>
  );
}
