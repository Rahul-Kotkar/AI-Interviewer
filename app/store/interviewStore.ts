import { create } from 'zustand';

// Define the structure of our data
interface ResumeData {
  name: string;
  role: string;
  sections: { title: string; content: string; }[];
}

interface InterviewState {
  resumeData: ResumeData | null;
  interviewTitle: string;
  interviewCategory: string;
  questionOutline: string[];
  setResumeData: (data: ResumeData) => void;
  generateInterview: () => Promise<void>;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  resumeData: null,
  interviewTitle: '',
  interviewCategory: '',
  questionOutline: [],
  setResumeData: (data) => set({ resumeData: data }),
  generateInterview: async () => {
    const resumeData = get().resumeData;
    if (!resumeData) throw new Error("Resume data not available.");

    const response = await fetch('/api/generate-outline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resumeData),
    });
    if (!response.ok) throw new Error("Failed to generate interview outline.");

    const data = await response.json();
    set({
      interviewTitle: data.title,
      interviewCategory: data.category,
      questionOutline: data.questions,
    });
  },
}));