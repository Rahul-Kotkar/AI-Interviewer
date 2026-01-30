"use client";
import { useEffect, useState } from "react";

export default function FeedbackPage() {
  const [qaData, setQaData] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("qaData");
      if (saved) {
        setQaData(JSON.parse(saved));
        console.log("QA Data received:", JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load qaData:", err);
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Feedback Page</h1>
      <pre className="bg-gray-900 text-white p-4 rounded">
        {JSON.stringify(qaData, null, 2)}
      </pre>
    </div>
  );
}
