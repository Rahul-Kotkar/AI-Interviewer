"use client";

interface StatusMessagesProps {
  isLoading: boolean;
  loadingStatus: string;
  error: string;
}

export default function StatusMessages({
  isLoading,
  loadingStatus,
  error,
}: StatusMessagesProps) {
  if (isLoading) {
    return (
      <div className="text-center py-2">
        <p className="text-lg font-semibold text-violet-400 animate-pulse">
          {loadingStatus}
        </p>
      </div>
    );
  }

  if (error && !isLoading) {
    return <p className="text-center text-red-400">Error: {error}</p>;
  }

  return null;
}
