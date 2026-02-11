"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface Job {
  job_id: string;
  title: string;
}

interface Candidate {
  candidate_id: string;
  job_id: string;
  name: string;
  linkedin: string | null;
  status: 'applied' | 'interview' | 'hired';
  created_at: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Filters
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [searchName, setSearchName] = useState("");
  
  // Add candidate form
  const [showForm, setShowForm] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    job_id: "",
    name: "",
    linkedin: "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
      setAuthChecked(true);
    };
    checkUser();
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("job_id, title")
      .order("created_at", { ascending: false });
    
    setJobs(data || []);
  };

  const fetchCandidates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });
    
    setCandidates(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchCandidates();
    }
  }, [user]);

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCandidate.job_id || !newCandidate.name) return;

    const { error } = await supabase
      .from("candidates")
      .insert([{
        job_id: newCandidate.job_id,
        name: newCandidate.name,
        linkedin: newCandidate.linkedin || null,
        status: 'applied',
      }]);

    if (!error) {
      setNewCandidate({ job_id: "", name: "", linkedin: "" });
      setShowForm(false);
      fetchCandidates();
    }
  };

  const handleStatusChange = async (candidateId: string, newStatus: 'applied' | 'interview' | 'hired') => {
    await supabase
      .from("candidates")
      .update({ status: newStatus })
      .eq("candidate_id", candidateId);
    
    fetchCandidates();
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm("Är du säker?")) return;

    await supabase
      .from("candidates")
      .delete()
      .eq("candidate_id", candidateId);
    
    fetchCandidates();
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(candidate => {
    const matchesJob = selectedJob === "all" || candidate.job_id === selectedJob;
    const matchesName = candidate.name.toLowerCase().includes(searchName.toLowerCase());
    return matchesJob && matchesName;
  });

  // Group by status
  const appliedCandidates = filteredCandidates.filter(c => c.status === 'applied');
  const interviewCandidates = filteredCandidates.filter(c => c.status === 'interview');
  const hiredCandidates = filteredCandidates.filter(c => c.status === 'hired');

  const getJobTitle = (jobId: string) => {
    return jobs.find(j => j.job_id === jobId)?.title || "Okänt jobb";
  };

  if (!authChecked || !user) {
    return <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="animate-pulse text-gray-600">Laddar...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 border-b border-slate-200 sticky top-0 z-20 backdrop-blur-lg bg-white/80">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Kandidater</h1>
                <p className="text-sm text-slate-500">{filteredCandidates.length} kandidater</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {showForm ? 'Stäng' : 'Ny Kandidat'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border-2 border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder:text-slate-400"
                placeholder="Sök kandidat..."
              />
            </div>

            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            >
              <option value="all">Alla jobb</option>
              {jobs.map(job => (
                <option key={job.job_id} value={job.job_id}>{job.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Lägg till kandidat</h2>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Namn *</label>
                <input
                  type="text"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:border-violet-500 transition-all outline-none placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Jobb *</label>
                <select
                  value={newCandidate.job_id}
                  onChange={(e) => setNewCandidate({...newCandidate, job_id: e.target.value})}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:border-violet-500 transition-all outline-none placeholder:text-slate-400"
                  required
                >
                  <option value="">Välj jobb</option>
                  {jobs.map(job => (
                    <option key={job.job_id} value={job.job_id}>{job.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={newCandidate.linkedin}
                  onChange={(e) => setNewCandidate({...newCandidate, linkedin: e.target.value})}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 focus:border-violet-500 transition-all outline-none placeholder:text-slate-400"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Lägg till
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applied Column */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Ansökt</h3>
                  <p className="text-xs text-slate-500">{appliedCandidates.length} kandidater</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {appliedCandidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.candidate_id}
                  candidate={candidate}
                  jobTitle={getJobTitle(candidate.job_id)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteCandidate}
                  index={index}
                />
              ))}
              {appliedCandidates.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Inga kandidater
                </div>
              )}
            </div>
          </div>

          {/* Interview Column */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-blue-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Intervju</h3>
                  <p className="text-xs text-blue-600">{interviewCandidates.length} kandidater</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {interviewCandidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.candidate_id}
                  candidate={candidate}
                  jobTitle={getJobTitle(candidate.job_id)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteCandidate}
                  index={index}
                />
              ))}
              {interviewCandidates.length === 0 && (
                <div className="text-center py-12 text-blue-300 text-sm">
                  Inga kandidater
                </div>
              )}
            </div>
          </div>

          {/* Hired Column */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-emerald-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900">Anställd</h3>
                  <p className="text-xs text-emerald-600">{hiredCandidates.length} kandidater</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {hiredCandidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.candidate_id}
                  candidate={candidate}
                  jobTitle={getJobTitle(candidate.job_id)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteCandidate}
                  index={index}
                />
              ))}
              {hiredCandidates.length === 0 && (
                <div className="text-center py-12 text-emerald-300 text-sm">
                  Inga kandidater
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

function CandidateCard({ 
  candidate, 
  jobTitle, 
  onStatusChange, 
  onDelete,
  index
}: { 
  candidate: any;
  jobTitle: string;
  onStatusChange: (id: string, status: 'applied' | 'interview' | 'hired') => void;
  onDelete: (id: string) => void;
  index: number;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer animate-slide-in"
      style={{animationDelay: `${index * 0.05}s`}}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-slate-900">{candidate.name}</h4>
        <button
          onClick={() => onDelete(candidate.candidate_id)}
          className={`p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      <p className="text-xs text-slate-500 mb-3">{jobTitle}</p>
      
      {candidate.linkedin && (
        <a 
          href={candidate.linkedin} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium mb-3"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          Profil
        </a>
      )}
      
      <div className={`flex gap-1.5 transition-all ${showActions ? 'opacity-100' : 'opacity-0'}`}>
        {candidate.status !== 'applied' && (
          <button
            onClick={() => onStatusChange(candidate.candidate_id, 'applied')}
            className="flex-1 px-2 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-medium"
          >
            ← Ansökt
          </button>
        )}
        {candidate.status !== 'interview' && (
          <button
            onClick={() => onStatusChange(candidate.candidate_id, 'interview')}
            className="flex-1 px-2 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-medium"
          >
            Intervju
          </button>
        )}
        {candidate.status !== 'hired' && (
          <button
            onClick={() => onStatusChange(candidate.candidate_id, 'hired')}
            className="flex-1 px-2 py-1.5 text-xs bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all font-medium"
          >
            Anställ →
          </button>
        )}
      </div>


    </div>
  );
}