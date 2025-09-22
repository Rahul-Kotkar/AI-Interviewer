import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function extractJson(text: string) {
  const jsonMatch = text.match(/```json([\s\S]*?)```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      return null;
    }
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const resumeData = await req.json();
    if (!resumeData) {
      return NextResponse.json(
        { error: "Valid resume data is required." },
        { status: 400 }
      );
    }
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
            You are a senior hiring manager. Based on the candidate's resume, determine an interview title, a category, and generate 7 insightful questions.
            Return a valid JSON object with three keys: "title", "category", and "questions".
            - "title": A short title for the interview.
            - "category": A single category (e.g., "Technical").
            - "questions": An array of 7 string questions.

            Candidate's Data:
            \`\`\`json
            ${JSON.stringify(resumeData)}
            \`\`\`
        `;
    const result = await model.generateContent(prompt);
    const jsonData = extractJson(result.response.text());
    if (!jsonData) {
      throw new Error("AI failed to generate outline.");
    }
    return NextResponse.json(jsonData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
