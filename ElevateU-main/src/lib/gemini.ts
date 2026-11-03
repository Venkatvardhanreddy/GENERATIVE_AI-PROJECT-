import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export const model = ai.models.generateContent.bind(ai.models);

export interface ResumeAnalysis {
  education: string[];
  skills: string[];
  projects: string[];
  internships: string[];
  certifications: string[];
  achievements: string[];
  grammarIssues: string[];
  formattingIssues: string[];
  missingSections: string[];
  overallScore: number;
  impactLevel: 'High' | 'Medium' | 'Low';
  improvementSuggestions: {
    section: string;
    suggestion: string;
    betterWording?: string;
    reason?: string;
  }[];
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const prompt = `
    Analyze the following resume for a B.Tech student (fresher level).
    Provide a detailed breakdown in JSON format.
    
    Resume Text:
    ${resumeText}
    
    Expected JSON structure:
    {
      "education": ["..."],
      "skills": ["..."],
      "projects": ["..."],
      "internships": ["..."],
      "certifications": ["..."],
      "achievements": ["..."],
      "grammarIssues": ["..."],
      "formattingIssues": ["..."],
      "missingSections": ["..."],
      "overallScore": 85,
      "impactLevel": "High",
      "improvementSuggestions": [
        { 
          "section": "...", 
          "suggestion": "...", 
          "betterWording": "...",
          "reason": "Explain why this change is important for ATS or recruiters"
        }
      ]
    }

    CRITICAL: Provide the BEST POSSIBLE suggestions. Focus on:
    - Quantifying achievements (e.g., "Increased efficiency by 20%")
    - Using strong action verbs
    - ATS optimization
    - Skill gap identification
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function getInterviewQuestion(
  resumeText: string,
  interviewType: 'Technical' | 'HR',
  history: { role: 'user' | 'model', text: string }[]
): Promise<string> {
  const systemInstruction = interviewType === 'Technical' 
    ? `You are a technical interviewer for a B.Tech student. 
       Ask questions strictly based on the skills, projects, and technologies mentioned in the resume.
       Focus on core concepts and practical application.
       Ask ONE question at a time. Maintain a realistic flow.`
    : `You are an HR interviewer for a B.Tech student.
       Ask standard HR questions like self-introduction, strengths/weaknesses, teamwork, and career goals.
       Reference their projects or internships where relevant.
       Ask ONE question at a time. Maintain a realistic flow.`;

  const prompt = `
    Resume: ${resumeText}
    Interview Type: ${interviewType}
    
    Based on the resume and the conversation history, ask the next interview question.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction,
    },
  });

  return response.text || "Could you tell me more about your background?";
}

export async function getInterviewAnalysis(
  interviewType: 'Technical' | 'HR',
  messages: { role: 'user' | 'model', text: string }[]
): Promise<{ feedback: string, modelAnswers: { question: string, bestAnswer: string, yourAnswer: string }[] }> {
  const prompt = `
    Analyze the following ${interviewType} interview session.
    
    Interview Transcript:
    ${messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.text}`).join('\n')}
    
    Provide:
    1. Overall feedback on performance.
    2. For each question asked by the interviewer, provide the "Best Possible Answer" that the candidate should have given, especially for technical questions.
    
    Expected JSON structure:
    {
      "feedback": "...",
      "modelAnswers": [
        { "question": "...", "bestAnswer": "...", "yourAnswer": "..." }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text || "{}");
}
