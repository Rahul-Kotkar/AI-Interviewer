"use client";

// The interface can be simplified as the formatting function will handle the structure
interface ResumeData {
  name: string;
  role: string;
  skills: any;
  technologies: any;
  experienceSummary: any;
  projects: any;
}

interface EditorFormProps {
  resumeData: ResumeData;
  handleDataChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleStartInterview: () => void;
}

// --- NEW ROBUST HELPER FUNCTION ---
// This function is now designed to handle any object structure from the AI.
const formatValueForDisplay = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return (
      value
        .map((item) => {
          // If the item in the array is an object, join its values.
          if (typeof item === "object" && item !== null) {
            // e.g., for { title: "AI Bot", desc: "..." }, this becomes "AI Bot - ..."
            return Object.values(item).join(" - ");
          }
          // If it's just a string in an array (like for skills).
          return String(item);
        })
        // Separate each project or item with a new line for better readability.
        .join("\n")
    );
  }
  return "";
};

export default function EditorForm({
  resumeData,
  handleDataChange,
  handleStartInterview,
}: EditorFormProps) {
  const inputStyle =
    "w-full bg-[#121212] border border-gray-600 rounded-md p-3 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition";
  const labelStyle = "block mb-2 text-sm font-medium text-gray-300";

  return (
    <div className="border-t border-gray-700 pt-8">
      <h2 className="text-2xl font-bold text-white mb-6">
        Verify Your Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className={labelStyle}>
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formatValueForDisplay(resumeData.name)}
            onChange={handleDataChange}
            className={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="role" className={labelStyle}>
            Current Role / Title
          </label>
          <input
            type="text"
            id="role"
            name="role"
            value={formatValueForDisplay(resumeData.role)}
            onChange={handleDataChange}
            className={inputStyle}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="skills" className={labelStyle}>
            Skills
          </label>
          <textarea
            id="skills"
            name="skills"
            value={formatValueForDisplay(resumeData.skills)}
            onChange={handleDataChange}
            className={inputStyle}
            rows={3}
          ></textarea>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="technologies" className={labelStyle}>
            Technologies & Tools
          </label>
          <textarea
            id="technologies"
            name="technologies"
            value={formatValueForDisplay(resumeData.technologies)}
            onChange={handleDataChange}
            className={inputStyle}
            rows={3}
          ></textarea>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="experienceSummary" className={labelStyle}>
            Experience Summary
          </label>
          <textarea
            id="experienceSummary"
            name="experienceSummary"
            value={formatValueForDisplay(resumeData.experienceSummary)}
            onChange={handleDataChange}
            className={inputStyle}
            rows={4}
          ></textarea>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="projects" className={labelStyle}>
            Key Projects
          </label>
          <textarea
            id="projects"
            name="projects"
            value={formatValueForDisplay(resumeData.projects)}
            onChange={handleDataChange}
            className={inputStyle}
            rows={4}
          ></textarea>
        </div>
      </div>
      <div className="mt-8">
        <button
          onClick={handleStartInterview}
          className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-all"
        >
          Start The Interview
        </button>
      </div>
    </div>
  );
}
