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
    const { text: resumeText } = await req.json();
    if (!resumeText) {
      return NextResponse.json(
        { error: "Resume text is required." },
        { status: 400 }
      );
    }

    // --- 1. USING THE MORE RELIABLE MODEL ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
            You are an expert resume analyzer. Your task is to analyze the resume text and structure the key information into a single, valid JSON object.

            The JSON object MUST have three top-level keys: "name", "role", and "sections".
            - "name": The candidate's full name.
            - "role": The candidate's most recent or primary job title.
            - "sections": An array of objects. Each object MUST have a "title" string and a "content" string.

            CRITICAL INSTRUCTIONS:
            1. Identify all logical sections in the resume. Common titles are "Summary", "Experience", "Skills", "Projects", "Education", but they can be anything (e.g., "Legal Cases", "Publications").
            2. For each section you identify, create an object in the "sections" array with its title and its complete text content.
            3. DO NOT leave the "content" field empty. If a section has a title, it must have content.

            HERE IS A PERFECT EXAMPLE of the output format for a lawyer's resume:
            {
              "name": "John Smith, Esq.",
              "role": "Corporate Counsel",
              "sections": [
                { "title": "Bar Admissions", "content": "State Bar of California, 2015" },
                { "title": "Professional Experience", "content": "ACME Corporation, Corporate Counsel (2018-Present)\\n- Managed all legal aspects..." },
                { "title": "Education", "content": "Stanford Law School, Juris Doctor (J.D.), 2015" }
              ]
            }

            Now, analyze the following resume text and provide the JSON object:

            Resume Text:
            \`\`\`
            ${resumeText}
            \`\`\`
        `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonData = extractJson(responseText);

    // --- 2. NEW VERIFICATION STEP ---
    if (
      !jsonData ||
      !jsonData.name ||
      !jsonData.role ||
      !Array.isArray(jsonData.sections)
    ) {
      throw new Error(
        "AI response is missing key fields (name, role, or sections)."
      );
    }

    // Check if every section has a non-empty title and content
    const areSectionsValid = jsonData.sections.every(
      (section: any) =>
        section &&
        typeof section.title === "string" &&
        section.title.trim() !== "" &&
        typeof section.content === "string" &&
        section.content.trim() !== ""
    );

    if (!areSectionsValid) {
      throw new Error(
        "AI failed to extract content for one or more resume sections. Please check the resume formatting."
      );
    }
    // --- END OF VERIFICATION STEP ---

    return NextResponse.json(jsonData);
  } catch (error: any) {
    console.error("Error in /api/parse-resume:", error);
    // Send a more user-friendly error message back to the frontend
    return NextResponse.json(
      { error: error.message || "An error occurred while parsing the resume." },
      { status: 500 }
    );
  }
}
