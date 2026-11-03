import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { analyzeResume, ResumeAnalysis } from '@/src/lib/gemini';
import { parseResumeWithUnstructured } from '@/src/lib/unstructured';
import { AlertCircle, CheckCircle2, FileText, Lightbulb, Loader2, Sparkles, Upload, ArrowRight, Info, Check, X, Target, Zap } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import { toast } from 'sonner';

// Set worker source for pdfjs (Fallback)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ResumeReviewProps {
  onSave: (content: string, analysis: ResumeAnalysis) => void;
}

export function ResumeReview({ onSave }: ResumeReviewProps) {
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeResume(resumeText);
      setAnalysis(result);
      onSave(resumeText, result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setIsExtracting(true);
    try {
      // Try Unstructured.io first
      try {
        const parsedText = await parseResumeWithUnstructured(file);
        setResumeText(parsedText);
        toast.success('Resume extracted successfully');
      } catch (unstructuredError) {
        console.warn('Primary extraction failed, falling back to secondary:', unstructuredError);
        
        // Fallback to pdfjs-dist
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        setResumeText(fullText);
        toast.info('Basic extraction completed');
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      toast.error('Failed to extract text from PDF. Please try pasting the text manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row gap-8 items-stretch min-h-[calc(100vh-12rem)]">
        {/* Input Section */}
        <div className={`flex-1 flex flex-col transition-all duration-500 ${analysis ? 'lg:max-w-[40%]' : 'w-full'}`}>
          <Card className="flex-1 border-none shadow-xl bg-white overflow-hidden flex flex-col">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Resume Editor
                  </CardTitle>
                  <CardDescription>Paste content or upload your PDF</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 bg-white shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                >
                  {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="hidden sm:inline">Upload PDF</span>
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative">
              <Textarea
                placeholder="Start typing or paste your resume content here..."
                className="w-full h-full min-h-[400px] border-none focus-visible:ring-0 resize-none p-6 text-base leading-relaxed font-sans"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
              <div className="absolute bottom-6 right-6">
                <Button 
                  size="lg"
                  className="shadow-xl shadow-primary/20 gap-2 px-8" 
                  disabled={isAnalyzing || isExtracting || !resumeText.trim()}
                  onClick={handleAnalyze}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Section */}
        <AnimatePresence mode="wait">
          {analysis ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col min-w-0"
            >
              <div className="space-y-6 flex flex-col h-full">
                {/* Score Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-primary text-white">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs uppercase tracking-widest font-bold opacity-80">Skills Match</p>
                          <h3 className="text-3xl font-bold mt-1">{analysis.skills.length} Found</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Target className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1">
                        {analysis.skills?.slice(0, 5).map((s, i) => (
                          <Badge key={i} className="bg-white/20 hover:bg-white/30 border-none text-[10px]">{s}</Badge>
                        ))}
                        {(analysis.skills?.length || 0) > 5 && <span className="text-[10px] opacity-60">+{(analysis.skills?.length || 0) - 5} more</span>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-lg bg-white">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Impact Score</p>
                          <h3 className="text-3xl font-bold mt-1 text-primary">{analysis.impactLevel || 'N/A'}</h3>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <Zap className="w-6 h-6" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4 font-medium">Based on {analysis.projects.length} key projects identified.</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Feedback */}
                <Card className="flex-1 border-none shadow-xl bg-white overflow-hidden flex flex-col">
                  <CardHeader className="border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" /> Detailed Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    <ScrollArea className="h-full max-h-[600px]">
                      <div className="p-6 space-y-8">
                        {/* Missing Sections */}
                        {(analysis.missingSections?.length || 0) > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                              <X className="w-4 h-4" /> Critical Gaps
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {analysis.missingSections?.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-destructive/5 text-destructive border border-destructive/10 text-sm font-medium">
                                  <AlertCircle className="w-4 h-4" /> {s}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Improvements */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Strategic Improvements
                          </h4>
                          <div className="space-y-4">
                            {analysis.improvementSuggestions?.map((s, i) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-5 rounded-2xl border bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-300 group"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline" className="bg-white text-primary border-primary/20">{s.section}</Badge>
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-4 h-4" />
                                  </div>
                                </div>
                                <p className="text-sm font-medium leading-relaxed mb-4">{s.suggestion}</p>
                                {s.reason && (
                                  <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-600 leading-relaxed"><span className="font-bold text-primary">Why:</span> {s.reason}</p>
                                  </div>
                                )}
                                {s.betterWording && (
                                  <div className="bg-slate-900 rounded-xl p-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2">
                                      <Check className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Recommended Wording</p>
                                    <p className="text-sm text-slate-200 font-mono italic">"{s.betterWording}"</p>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden lg:flex flex-1 flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-3xl bg-slate-50/50"
            >
              <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold mb-2">AI Analysis Ready</h3>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Our Gemini-powered engine will scan your resume for ATS compatibility, skill gaps, and impact-driven wording.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
