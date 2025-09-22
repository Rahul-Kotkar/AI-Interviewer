"use client";

interface SpeakerPanelProps {
  type: "AI" | "User";
  name: string;
  isActive: boolean;
  statusText?: string; // Optional text like "Thinking..." or "Listening..."
}

export default function SpeakerPanel({
  type,
  name,
  isActive,
  statusText,
}: SpeakerPanelProps) {
  const isAI = type === "AI";

  // Determine border color based on who is active
  const borderClass = isActive
    ? isAI
      ? "border-violet-500 shadow-lg shadow-violet-500/30"
      : "border-blue-500 shadow-lg shadow-blue-500/30"
    : isAI
    ? "border-gray-700"
    : "border-gray-600";

  return (
    <div
      className={`bg-[#1F2937] p-8 rounded-2xl flex flex-col items-center justify-center text-center aspect-square border-2 transition-all duration-300 ${borderClass}`}
    >
      {isAI ? (
        // AI Panel
        <>
          <div className="w-32 h-32 bg-violet-900/50 rounded-full mb-4 flex items-center justify-center">
            <div
              className={`w-20 h-20 bg-violet-700/60 rounded-full ${
                isActive ? "animate-pulse" : ""
              }`}
            ></div>
          </div>
          <h2 className="text-2xl font-semibold">AI Interviewer</h2>
          {/* Show status text if the panel is active and text is provided */}
          {isActive && statusText && (
            <p className="mt-2 text-violet-400 font-semibold animate-pulse">
              {statusText}
            </p>
          )}
        </>
      ) : (
        // User Panel
        <>
          <img
            src="https://i.imgur.com/8Km9tLL.png"
            alt="User Avatar"
            className="w-32 h-32 rounded-full mb-4 object-cover"
          />
          <h2 className="text-2xl font-semibold">{name} (You)</h2>
          {isActive && (
            <p className="mt-2 text-blue-400 font-semibold animate-pulse">
              Listening...
            </p>
          )}
        </>
      )}
    </div>
  );
}
