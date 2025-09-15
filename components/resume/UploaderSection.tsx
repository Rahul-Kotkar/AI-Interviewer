"use client";

// Reusable Icons
const UploadIcon = () => (
  <svg
    className="w-12 h-12 mx-auto text-gray-500"
    stroke="currentColor"
    fill="none"
    viewBox="0 0 48 48"
    aria-hidden="true"
  >
    <path
      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-12 h-12 mx-auto text-green-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

interface UploaderSectionProps {
  fileName: string;
  isLoading: boolean;
  isDragActive: boolean;
  error: string;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UploaderSection({
  fileName,
  isLoading,
  isDragActive,
  error,
  handleDrag,
  handleDrop,
  handleFileChange,
}: UploaderSectionProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Upload Resume</h2>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-lg transition-all duration-300 
          ${
            isDragActive
              ? "border-violet-400 bg-violet-500/10"
              : "border-gray-600 hover:border-gray-500"
          }
          ${fileName && !isLoading && !error ? "border-green-500" : ""}
        `}
      >
        <input
          id="file-upload"
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={isLoading}
          accept=".pdf,.jpg,.jpeg,.png"
        />

        {fileName && !isLoading && !error ? (
          <div className="text-center">
            <CheckCircleIcon />
            <p className="mt-4 font-semibold text-gray-200">{fileName}</p>
            <p className="mt-1 text-sm text-gray-400">
              Upload new file to replace.
            </p>
          </div>
        ) : (
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <UploadIcon />
            <p className="mt-4 text-lg font-semibold text-gray-200">
              <span className="text-violet-400">Click to upload</span> or drag
              and drop
            </p>
            <p className="mt-1 text-sm text-gray-400">PDF, PNG, JPG</p>
          </label>
        )}
      </div>
    </div>
  );
}
