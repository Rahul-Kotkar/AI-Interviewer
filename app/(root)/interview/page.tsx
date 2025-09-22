import { useRouter } from 'next/navigation';
import { useInterviewStore } from "@/app/store/interviewStore";

"use client";

import dynamic from "next/dynamic";

const ResumeUploader = dynamic(() => import("@/components/ResumeUploader"), {
  ssr: false, // This is the key. It prevents server-side rendering.
});

export default function Home() {
  return (
    <main>
      <ResumeUploader />
    </main>
  );
}
