import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserProfile, ResumeRecord, InterviewRecord } from '@/src/lib/types';
import { BookOpen, Briefcase, Calendar, Edit, GraduationCap, History, MapPin, User, Camera, Loader2, Award, Target, Zap, Clock, ArrowUpRight, FileText, Bot, Trash2, CheckCircle2, ChevronDown } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile;
  resumes: ResumeRecord[];
  interviews: InterviewRecord[];
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string | null>;
  onDeleteResume: (id: string) => Promise<void>;
  onDeleteInterview: (id: string) => Promise<void>;
}

export function Profile({ profile, resumes, interviews, onUpdateProfile, onUploadAvatar, onDeleteResume, onDeleteInterview }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState({
    full_name: profile.full_name,
    degree: profile.degree,
    branch: profile.branch,
    college: profile.college,
    grad_year: profile.grad_year,
    skills: profile.skills.join(', '),
  });

  const handleSave = async () => {
    await onUpdateProfile({
      ...editData,
      skills: editData.skills.split(',').map(s => s.trim()).filter(s => s !== '')
    });
    setIsEditing(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Local check for file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      // Just a simple check, the actual error toast is handled in App.tsx via onUploadAvatar return
      // but we can prevent the upload state trigger if we want to be proactive.
    }

    setIsUploading(true);
    const publicUrl = await onUploadAvatar(file);
    if (publicUrl) {
      await onUpdateProfile({ avatar_url: publicUrl });
    }
    setIsUploading(false);
    
    // Reset file input so same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const latestAnalysis = resumes[0]?.analysis;
  const careerReadiness = latestAnalysis?.overallScore ? `${latestAnalysis.overallScore}%` : '0%';

  const stats = [
    { label: 'Resumes Analyzed', value: resumes.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Mock Interviews', value: interviews.length, icon: Bot, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Skills Tracked', value: profile.skills.length, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Career Readiness', value: careerReadiness, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="flex gap-6 items-center">
          <div className="relative group">
            <Avatar className="w-24 h-24 lg:w-32 lg:h-32 border-4 border-background shadow-2xl">
              <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{profile.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{profile.full_name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {profile.degree} in {profile.branch}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.college}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Class of {profile.grad_year}</span>
            </div>
          </div>
        </div>
        
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger render={<Button variant="outline" className="gap-2 shadow-sm" />}>
            <Edit className="w-4 h-4" /> Edit Profile
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your academic and professional details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={editData.full_name} onChange={(e) => setEditData({...editData, full_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grad_year">Graduation Year</Label>
                  <Input id="grad_year" value={editData.grad_year} onChange={(e) => setEditData({...editData, grad_year: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree</Label>
                  <Input id="degree" value={editData.degree} onChange={(e) => setEditData({...editData, degree: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input id="branch" value={editData.branch} onChange={(e) => setEditData({...editData, branch: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="college">College / University</Label>
                <Input id="college" value={editData.college} onChange={(e) => setEditData({...editData, college: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Input id="skills" value={editData.skills} onChange={(e) => setEditData({...editData, skills: e.target.value})} placeholder="e.g., JavaScript, Python, SQL, Project Management" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full sm:w-auto">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <CardContent className="p-6 relative">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500`} />
                <div className="relative">
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills Card */}
        <Card className="lg:col-span-1 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> Professional Skills
            </CardTitle>
            <CardDescription>Your core technical competencies</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.length > 0 ? (
                  profile.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 bg-slate-100 hover:bg-primary/10 hover:text-primary transition-colors cursor-default">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No skills listed. Analysis of resumes will automatically populate this.</p>
                )}
              </div>
          </CardContent>
        </Card>

        {/* Resume History */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Resume Analysis History
              </CardTitle>
              <CardDescription>Recent feedback on your applications</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold">View All</Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {resumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p>No resumes analyzed yet.</p>
                </div>
              ) : (
                <div className="space-y-4 pr-4">
                  {resumes.map((resume) => (
                    <div key={resume.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <FileText className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">Resume Review</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(resume.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteResume(resume.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Interview History */}
        <Card className="lg:col-span-3 border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Mock Interview Performance
              </CardTitle>
              <CardDescription>Track your progress in technical and HR rounds</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interviews.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bot className="w-12 h-12 mb-4 opacity-20" />
                  <p>No mock interviews taken yet.</p>
                </div>
              ) : (
                interviews.map((interview) => (
                  <React.Fragment key={interview.id}>
                    <Dialog>
                      <DialogTrigger 
                        nativeButton={false}
                        render={<div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all duration-300 group cursor-pointer relative" />}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-xl ${interview.type === 'Technical' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {interview.type === 'Technical' ? <BookOpen className="w-5 h-5" /> : <User className="w-5 h-5" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-white">{interview.type}</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteInterview(interview.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="font-bold">Session Feedback</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{interview.feedback}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(interview.duration / 60)}m {interview.duration % 60}s</span>
                          <span>{new Date(interview.created_at).toLocaleDateString()}</span>
                        </div>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {interview.type} Interview Analysis
                        </DialogTitle>
                        <DialogDescription>
                          Detailed breakdown of your performance and model answers.
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-6 py-4">
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">Overall Feedback</h4>
                            <p className="text-sm leading-relaxed">{interview.feedback}</p>
                          </div>

                          {interview.analysis?.modelAnswers && (
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">Question Analysis & Best Answers</h4>
                              {interview.analysis.modelAnswers.map((item, idx) => (
                                <div key={idx} className="space-y-3 p-4 rounded-xl border bg-slate-50">
                                  <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">Q</div>
                                    <p className="text-sm font-bold">{item.question}</p>
                                  </div>
                                  <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">A</div>
                                    <div className="space-y-2">
                                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Your Answer:</p>
                                      <p className="text-sm italic text-slate-600">"{item.yourAnswer || 'No response recorded'}"</p>
                                      <Separator className="my-2" />
                                      <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Best Possible Answer:</p>
                                      <p className="text-sm text-slate-900 leading-relaxed">{item.bestAnswer}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">Full Transcript</h4>
                            <div className="space-y-3">
                              {interview.transcript?.map((msg, idx) => (
                                <div key={idx} className={`flex gap-3 text-sm ${msg.role === 'user' ? 'text-primary' : 'text-slate-600'}`}>
                                  <span className="font-bold shrink-0 w-12 uppercase text-[10px] mt-1">{msg.role === 'user' ? 'You' : 'AI'}:</span>
                                  <p>{msg.text}</p>
                                </div>
                              )) || <p className="text-xs text-muted-foreground italic">No transcript available for this session.</p>}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </React.Fragment>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
