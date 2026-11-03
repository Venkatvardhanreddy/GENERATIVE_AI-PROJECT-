import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Profile } from './components/Profile';
import { ResumeReview } from './components/ResumeReview';
import { MockInterview } from './components/MockInterview';
import { UserProfile, ResumeRecord, InterviewRecord } from './lib/types';
import { Toaster, toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    let mounted = true;
    
    // Safety timeout: Ensure loading state is removed eventually
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth event:", event);
      setSession(session);
      
      if (session) {
        try {
          // Fire both fetches in parallel without blocking UI
          fetchProfile(session.user.id);
          fetchData(session.user.id);
        } catch (error) {
          console.error('Error initializing data:', error);
        }
      } else {
        setProfile(null);
        setResumes([]);
        setInterviews([]);
      }
      
      // Stop loading once we have a definitive auth state
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data as UserProfile);
    } else if (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchData = async (userId: string) => {
    // Fetch Resumes
    const { data: resumeData } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (resumeData) setResumes(resumeData as ResumeRecord[]);

    // Fetch Interviews
    const { data: interviewData } = await supabase
      .from('interviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (interviewData) setInterviews(interviewData as InterviewRecord[]);
  };

  const handleLogin = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
    }
  };

  const handleSignup = async (name: string, email: string, pass: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
      options: {
        data: { full_name: name }
      }
    });

    if (error) {
      if (error.message.includes('Email rate limit exceeded')) {
        toast.error('Sign-up rate limit reached. Please disable "Confirm Email" in your Supabase Auth settings to continue.');
      } else {
        toast.error(error.message);
      }
      return;
    }

    if (data.user) {
      const newProfile = {
        id: data.user.id,
        full_name: name,
        email,
        degree: '',
        branch: '',
        college: '',
        grad_year: '',
        skills: [],
      };

      const { error: profileError } = await supabase.from('profiles').insert([newProfile]);
      if (profileError) {
        toast.error('Error creating profile: ' + profileError.message);
      } else {
        setProfile(newProfile as any);
        toast.success('Account created successfully!');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
  };

  const handleUpdateProfile = async (updatedProfile: Partial<UserProfile>) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updatedProfile)
      .eq('id', session.user.id);

    if (error) {
      toast.error('Failed to update profile: ' + error.message);
    } else {
      toast.success('Profile updated successfully');
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
    }
  };

  const handleDeleteResume = async (id: string) => {
    const { error } = await supabase.from('resumes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete resume: ' + error.message);
    } else {
      toast.success('Resume deleted');
      setResumes(resumes.filter(r => r.id !== id));
    }
  };

  const handleDeleteInterview = async (id: string) => {
    const { error } = await supabase.from('interviews').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete interview: ' + error.message);
    } else {
      toast.success('Interview record deleted');
      setInterviews(interviews.filter(i => i.id !== id));
    }
  };

  const handleUploadAvatar = async (file: File): Promise<string | null> => {
    if (!session?.user) return null;
    
    // File size restriction: 2MB
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast.error('Image is too large. Max size is 2MB.');
      return null;
    }

    // File type restriction
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error detail:', uploadError);
      if (uploadError.message === 'The resource was not found') {
        toast.error('Storage bucket "avatars" not found. Please ensure it is created in your Supabase dashboard.');
      } else {
        toast.error('Error uploading image: ' + uploadError.message);
      }
      return null;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSaveResume = async (content: string, analysis: any) => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('resumes').insert([{
      user_id: session.user.id,
      content,
      analysis,
    }]).select();

    if (error) {
      toast.error('Failed to save resume: ' + error.message);
    } else {
      toast.success('Resume analysis saved to profile');
      if (data) setResumes([data[0] as ResumeRecord, ...resumes]);
    }
  };

  const handleCompleteInterview = async (type: 'Technical' | 'HR', duration: number, feedback: string, transcript: { role: 'user' | 'model', text: string }[], analysis: any) => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('interviews').insert([{
      user_id: session.user.id,
      type,
      duration,
      feedback,
      transcript,
      analysis
    }]).select();

    if (error) {
      toast.error('Failed to save interview: ' + error.message);
    } else {
      toast.success('Interview session saved');
      if (data) setInterviews([data[0] as InterviewRecord, ...interviews]);
      setActiveTab('profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Auth onLogin={handleLogin} onSignup={handleSignup} />
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout}
        userName={profile?.full_name || session.user.user_metadata?.full_name || 'Student'}
      >
        {activeTab === 'profile' && profile && (
          <Profile 
            profile={profile} 
            resumes={resumes} 
            interviews={interviews} 
            onUpdateProfile={handleUpdateProfile}
            onUploadAvatar={handleUploadAvatar}
            onDeleteResume={handleDeleteResume}
            onDeleteInterview={handleDeleteInterview}
          />
        )}
        {activeTab === 'resume' && (
          <ResumeReview onSave={handleSaveResume} />
        )}
        {activeTab === 'interview' && (
          <MockInterview 
            resumeText={resumes[0]?.content || "No resume uploaded yet. Please upload a resume for a personalized interview."} 
            onComplete={handleCompleteInterview} 
          />
        )}
      </Layout>
      <Toaster position="top-center" />
    </>
  );
}

