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
    const { conversationHistory, userAnswer, remainingQuestions } =
      await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
            You are "Alex," an expert, empathetic, and insightful technical interviewer. Your goal is to have a natural conversation. You must strictly follow these rules:

            1.  Analyze the user's last answer in the context of the question that was asked.
            2.  Based on your analysis, decide your next action: either ask a relevant follow-up question (\`cross-question\`) or move to the next question from the outline (\`next-question\`).
            3.  If the answer is short, vague, or misses a key point, you should \`cross-question\`. If the answer is thorough, you should \`next-question\`.
            4.  Your response MUST be a valid JSON object with three keys: "analysis" (your brief, private thoughts), "decision" (either "cross-question" or "next-question"), and "next_question_text" (the exact question you will ask next).

            --- Interview Context ---
            Full Conversation History: ${JSON.stringify(conversationHistory)}
            User's Latest Answer: "${userAnswer}"
            Remaining Questions in Outline: ${JSON.stringify(
              remainingQuestions
            )}

            Your JSON Response:
        `;

    const result = await model.generateContent(prompt);
    const jsonData = extractJson(result.response.text());

    if (!jsonData || !jsonData.decision || !jsonData.next_question_text) {
      throw new Error("AI response was not in the correct JSON format.");
    }

    return NextResponse.json(jsonData);
  } catch (error: any) {
    console.error("Error in /api/process-answer:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred." },
      { status: 500 }
    );
  }
}
