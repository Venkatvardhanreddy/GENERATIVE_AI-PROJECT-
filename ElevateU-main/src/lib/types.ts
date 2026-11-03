export interface UserProfile {
  id: string; // Supabase uses 'id' instead of 'uid'
  full_name: string;
  email: string;
  degree: string;
  branch: string;
  college: string;
  grad_year: string;
  skills: string[];
  avatar_url?: string;
  created_at: string;
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  content: string;
  analysis: any;
  created_at: string;
}

export interface InterviewRecord {
  id: string;
  user_id: string;
  type: 'Technical' | 'HR';
  duration: number;
  feedback: string;
  transcript: { role: 'user' | 'model', text: string }[];
  analysis?: {
    feedback: string;
    modelAnswers: { question: string, bestAnswer: string, yourAnswer: string }[];
  };
  created_at: string;
}
