import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInterviewQuestion, getInterviewAnalysis } from '@/src/lib/gemini';
import { Mic, MicOff, Play, Square, User, Bot, Loader2, Volume2, VolumeX, Sparkles, Video, VideoOff, MessageSquare, Info, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

interface MockInterviewProps {
  resumeText: string;
  onComplete: (type: 'Technical' | 'HR', duration: number, feedback: string, transcript: { role: 'user' | 'model', text: string }[], analysis: any) => void;
}

export function MockInterview({ resumeText, onComplete }: MockInterviewProps) {
  const [isActive, setIsActive] = useState(false);
  const [interviewType, setInterviewType] = useState<'Technical' | 'HR' | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showChat, setShowChat] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startInterview = async (type: 'Technical' | 'HR') => {
    setInterviewType(type);
    setIsActive(true);
    setIsThinking(true);
    
    try {
      const firstQuestion = await getInterviewQuestion(resumeText, type, []);
      setMessages([{ role: 'model', text: firstQuestion }]);
      speak(firstQuestion);
    } catch (error) {
      console.error('Failed to start interview:', error);
    } finally {
      setIsThinking(false);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      startListening();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    
    recognitionRef.current.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleUserResponse(transcript);
    };

    recognitionRef.current.start();
  };

  const handleUserResponse = async (text: string) => {
    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      const nextQuestion = await getInterviewQuestion(resumeText, interviewType!, newMessages);
      setMessages(prev => [...prev, { role: 'model', text: nextQuestion }]);
      speak(nextQuestion);
    } catch (error) {
      console.error('Failed to get next question:', error);
    } finally {
      setIsThinking(false);
    }
  };

  const stopInterview = async () => {
    setIsActive(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
    
    setIsThinking(true);
    try {
      const analysis = await getInterviewAnalysis(interviewType!, messages);
      onComplete(interviewType!, duration, analysis.feedback, messages, analysis);
    } catch (error) {
      console.error('Failed to analyze interview:', error);
      onComplete(interviewType!, duration, "Interview completed. Analysis failed.", messages, null);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isActive) {
    return (
      <div className="space-y-8 pb-20">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <Badge variant="secondary" className="px-4 py-1 rounded-full bg-primary/10 text-primary border-primary/20">
            AI-Powered Simulation
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">Master Your Interview</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Practice with our voice-enabled AI interviewer tailored to your B.Tech profile. 
            Get real-time feedback and improve your confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden" onClick={() => startInterview('Technical')}>
            <CardContent className="p-0">
              <div className="p-8 space-y-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:scale-110">
                  <Bot className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Technical Round</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Deep dive into your core engineering skills, projects, and problem-solving abilities.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  Start Simulation <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="h-2 bg-blue-500/10 group-hover:bg-primary transition-colors" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden" onClick={() => startInterview('HR')}>
            <CardContent className="p-0">
              <div className="p-8 space-y-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:scale-110">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">HR & Behavioral</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Focus on communication, cultural fit, situational judgment, and career aspirations.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  Start Simulation <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="h-2 bg-emerald-500/10 group-hover:bg-primary transition-colors" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] pb-20">
      {/* Main Interview View */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <Card className="flex-1 border-none shadow-2xl bg-slate-900 overflow-hidden relative group">
          {/* Simulated Video Feed / AI Avatar */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className={`w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/30 transition-all duration-500 ${isSpeaking ? 'scale-110 shadow-[0_0_50px_rgba(99,102,241,0.4)]' : ''}`}>
                <Bot className={`w-24 h-24 lg:w-32 lg:h-32 text-primary transition-all duration-500 ${isSpeaking ? 'animate-pulse' : ''}`} />
              </div>
              {isThinking && (
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-3 shadow-xl flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Thinking</span>
                </div>
              )}
            </div>
          </div>

          {/* Overlay Controls */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
            <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              LIVE: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </Badge>
            <Badge className="bg-primary/20 backdrop-blur-md border-primary/30 text-primary-foreground px-4 py-2 rounded-xl">
              {interviewType}
            </Badge>
          </div>

          <div className="absolute top-6 right-6 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20" onClick={() => setShowChat(!showChat)}>
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button variant="destructive" onClick={stopInterview} className="gap-2 shadow-xl">
              <Square className="w-4 h-4" /> End
            </Button>
          </div>

          {/* Bottom Status Bar */}
          <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-12">
                <div className={`p-4 rounded-full transition-all duration-500 ${isSpeaking ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white/10 text-white/40'}`}>
                  <Volume2 className="w-8 h-8" />
                </div>
                
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                  isListening ? 'bg-red-500 text-white scale-110 animate-pulse' : 'bg-white text-slate-900'
                }`}>
                  {isListening ? <Mic className="w-12 h-12" /> : <MicOff className="w-12 h-12 opacity-40" />}
                </div>

                <div className={`p-4 rounded-full transition-all duration-500 ${isThinking ? 'bg-amber-500 text-white scale-110 shadow-lg' : 'bg-white/10 text-white/40'}`}>
                  <Zap className="w-8 h-8" />
                </div>
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">
                {isSpeaking ? 'AI is speaking...' : isListening ? 'Listening to you...' : isThinking ? 'AI is processing...' : 'Waiting for response'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat History Sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 400 }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            className="hidden lg:flex flex-col"
          >
            <Card className="flex-1 border-none shadow-2xl bg-white overflow-hidden flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> Transcription
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-full" ref={scrollRef}>
                  <div className="p-6 space-y-6">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[90%] p-4 rounded-2xl ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-slate-100 text-slate-900 rounded-tl-none'
                        }`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">
                            {msg.role === 'user' ? 'You' : 'AI Interviewer'}
                          </p>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isThinking && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
