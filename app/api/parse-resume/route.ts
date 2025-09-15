import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Gemini AI client with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper function to robustly extract JSON from Gemini's markdown response
function extractJson(text: string) {
  const jsonMatch = text.match(/```json([\s\S]*?)```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error("Failed to parse JSON from markdown", e);
      return null;
    }
  }
  // Fallback for cases where markdown is not used
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

// Define the POST handler for your API route
export async function POST(req: Request) {
  try {
    const { text } = await req.json(); // Get the raw text from the request body

    if (!text) {
      return NextResponse.json(
        { error: "Resume text is required." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
            You are an expert resume parser. Analyze the following resume text and extract the specified information. Present the output as a valid JSON object within a markdown code block.

            Fields to extract:
            - name: The full name of the candidate. Default to "Not Found" if missing.
            - role: The most recent job title (e.g., "Senior Software Engineer"). Default to "Not Found".
            - skills: A comma-separated string of technical skills.
            - technologies: A comma-separated string of tools and technologies.
            - experienceSummary: A 2-3 sentence summary of the professional experience.
            - projects: A summary of the most important projects mentioned.

            Resume Text:
            \`\`\`
            ${text}
            \`\`\`
        `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonData = extractJson(responseText);

    if (!jsonData) {
      throw new Error("Failed to parse JSON from Gemini's response.");
    }

    // Send the structured JSON back to the frontend
    return NextResponse.json(jsonData);
  } catch (error) {
    console.error("Error in /api/parse-resume:", error);
    return NextResponse.json(
      { error: "An error occurred while parsing the resume." },
      { status: 500 }
    );
  }
}
