"use client";

// New interfaces to match the dynamic structure
interface Section {
  title: string;
  content: string;
}

interface ResumeData {
  name: string;
  role: string;
  sections: Section[];
}

interface EditorFormProps {
  resumeData: ResumeData;
  // The data change handler now needs to know which section is being edited
  handleDataChange: (field: "name" | "role" | number, value: string) => void;
  handleStartInterview: () => void;
}

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
      <div className="space-y-6">
        {/* Static fields for Name and Role */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className={labelStyle}>
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={resumeData.name}
              onChange={(e) => handleDataChange("name", e.target.value)}
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
              value={resumeData.role}
              onChange={(e) => handleDataChange("role", e.target.value)}
              className={inputStyle}
            />
          </div>
        </div>

        {/* Dynamic sections are generated here */}
        {resumeData.sections.map((section, index) => (
          <div key={index}>
            {/* The section title is a non-editable heading */}
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              {section.title}
            </h3>
            {/* The section content is an editable textarea */}
            <textarea
              name={`section-${index}`}
              value={section.content}
              onChange={(e) => handleDataChange(index, e.target.value)}
              className={inputStyle}
              rows={4}
            ></textarea>
          </div>
        ))}
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
