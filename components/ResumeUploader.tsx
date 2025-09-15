"use client";

import { useState, useRef, useEffect } from "react";
import Tesseract from "tesseract.js";
import UploaderSection from "./resume/UploaderSection";
import EditorForm from "./resume/EditorForm";
import StatusMessages from "./resume/StatusMessages";

// Data Structure
interface ResumeData {
  name: string;
  role: string;
  skills: string;
  technologies: string;
  experienceSummary: string;
  projects: string;
}

export default function ResumePage() {
  // --- ALL STATE AND LOGIC REMAINS HERE, UNCHANGED ---
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "pdf-result") {
        parseTextWithAI(event.data.text);
      } else if (event.data.type === "pdf-error") {
        setError(event.data.error);
        setIsLoading(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const extractTextFromOCR = async (file: File): Promise<string> => {
    const {
      data: { text },
    } = await Tesseract.recognize(file, "eng");
    return text;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingStatus("Extracting text...");
    setError("");
    setResumeData(null);
    setFileName(file.name);

    try {
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = () => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "process-pdf", file: reader.result },
            "*"
          );
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type.startsWith("image/")) {
        const text = await extractTextFromOCR(file);
        await parseTextWithAI(text);
      } else {
        setError("Unsupported file type.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred during processing."
      );
      setIsLoading(false);
    }
  };

  const parseTextWithAI = async (text: string) => {
    setLoadingStatus("AI is analyzing details...");
    try {
      const response = await fetch("/api/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || "AI parsing failed.");
      }
      const data: ResumeData = await response.json();
      setResumeData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const handleDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!resumeData) return;
    setResumeData({ ...resumeData, [e.target.name]: e.target.value });
  };

  const handleStartInterview = () => {
    console.log("Starting interview with:", resumeData);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const syntheticEvent = {
        target: { files: e.dataTransfer.files },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(syntheticEvent);
    }
  };
  // --- END OF LOGIC SECTION ---

  return (
    <div className="bg-[#121212] min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            AI Interview Prep
          </h1>
          <p className="mt-3 text-md text-gray-400">
            Upload your resume to start a personalized interview session.
          </p>
        </div>

        <div className="bg-[#1F2937] rounded-xl shadow-lg p-6 sm:p-8 space-y-8">
          <UploaderSection
            fileName={fileName}
            isLoading={isLoading}
            isDragActive={isDragActive}
            error={error}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
            handleFileChange={handleFileChange}
          />

          <StatusMessages
            isLoading={isLoading}
            loadingStatus={loadingStatus}
            error={error}
          />

          {resumeData && !isLoading && (
            <EditorForm
              resumeData={resumeData}
              handleDataChange={handleDataChange}
              handleStartInterview={handleStartInterview}
            />
          )}
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src="/pdf-worker.html"
        style={{ display: "none" }}
      ></iframe>
    </div>
  );
}
