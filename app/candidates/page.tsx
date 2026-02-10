"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Filter states
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [searchName, setSearchName] = useState("");
  
  // Add candidate form
  const [showForm, setShowForm] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    job_id: "",
    name: "",
    linkedin: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
    };
    checkUser();
  }, [router]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("job_id, title")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      setJobs(data || []);
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching candidates:", error);
    } else {
      setCandidates(data || []);
    }
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
    
    if (!newCandidate.job_id || !newCandidate.name) {
      alert("Fyll i namn och välj jobb");
      return;
    }

    const { error } = await supabase
      .from("candidates")
      .insert([{
        job_id: newCandidate.job_id,
        name: newCandidate.name,
        linkedin: newCandidate.linkedin || null,
        status: 'applied',
      }]);

    if (error) {
      console.error("Error adding candidate:", error);
      alert("Kunde inte lägga till kandidat: " + error.message);
    } else {
      setNewCandidate({ job_id: "", name: "", linkedin: "" });
      setShowForm(false);
      fetchCandidates();
    }
  };

  const handleStatusChange = async (candidateId: string, newStatus: 'applied' | 'interview' | 'hired') => {
    const { error } = await supabase
      .from("candidates")
      .update({ status: newStatus })
      .eq("candidate_id", candidateId);

    if (error) {
      console.error("Error updating status:", error);
      alert("Kunde inte uppdatera status");
    } else {
      fetchCandidates();
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna kandidat?")) return;

    const { error } = await supabase
      .from("candidates")
      .delete()
      .eq("candidate_id", candidateId);

    if (error) {
      console.error("Error deleting candidate:", error);
      alert("Kunde inte ta bort kandidat");
    } else {
      fetchCandidates();
    }
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(candidate => {
    const matchesJob = selectedJob === "all" || candidate.job_id === selectedJob;
    const matchesName = candidate.name.toLowerCase().includes(searchName.toLowerCase());
    return matchesJob && matchesName;
  });

  // Group by status for Kanban
  const appliedCandidates = filteredCandidates.filter(c => c.status === 'applied');
  const interviewCandidates = filteredCandidates.filter(c => c.status === 'interview');
  const hiredCandidates = filteredCandidates.filter(c => c.status === 'hired');

  const getJobTitle = (jobId: string) => {
    const job = jobs.find(j => j.job_id === jobId);
    return job?.title || "Okänt jobb";
  };

  if (!user) {
    return <div className="p-10">Laddar...</div>;
  }

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kandidater - Kanban</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {showForm ? "Avbryt" : "+ Ny Kandidat"}
        </button>
      </div>

      {/* Add Candidate Form */}
      {showForm && (
        <div className="bg-white p-5 rounded shadow mb-6">
          <h2 className="font-bold text-lg mb-3">Lägg till Kandidat</h2>
          <form onSubmit={handleAddCandidate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-sm font-semibold">Namn *</label>
              <input
                type="text"
                value={newCandidate.name}
                onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                className="border w-full px-3 py-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold">Jobb *</label>
              <select
                value={newCandidate.job_id}
                onChange={(e) => setNewCandidate({...newCandidate, job_id: e.target.value})}
                className="border w-full px-3 py-2 rounded"
                required
              >
                <option value="">Välj jobb</option>
                {jobs.map(job => (
                  <option key={job.job_id} value={job.job_id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold">LinkedIn</label>
              <input
                type="url"
                value={newCandidate.linkedin}
                onChange={(e) => setNewCandidate({...newCandidate, linkedin: e.target.value})}
                className="border w-full px-3 py-2 rounded"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Lägg till
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-semibold">Filtrera på jobb</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="border w-full px-3 py-2 rounded"
            >
              <option value="all">Alla jobb</option>
              {jobs.map(job => (
                <option key={job.job_id} value={job.job_id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-semibold">Sök kandidat</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="border w-full px-3 py-2 rounded"
              placeholder="Namn..."
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-10">Laddar kandidater...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Applied Column */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h2 className="font-bold text-lg mb-3 flex items-center justify-between">
              <span>📝 Ansökt</span>
              <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm">
                {appliedCandidates.length}
              </span>
            </h2>
            <div className="space-y-3">
              {appliedCandidates.map(candidate => (
                <CandidateCard
                  key={candidate.candidate_id}
                  candidate={candidate}
                  jobTitle={getJobTitle(candidate.job_id)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteCandidate}
                />
              ))}
              {appliedCandidates.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">Inga kandidater</p>
              )}
            </div>
          </div>

          {/* Interview Column */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h2 className="font-bold text-lg mb-3 flex items-center justify-between">
              <span>💼 Intervju</span>
              <span className="bg-blue-300 text-blue-700 px-2 py-1 rounded text-sm">
                {interviewCandidates.length}
              </span>
            </h2>
            <div className="space-y-3">
              {interviewCandidates.map(candidate => (
                <CandidateCard
                  key={candidate.candidate_id}
                  candidate={candidate}
                  jobTitle={getJobTitle(candidate.job_id)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteCandidate}
                />
              ))}
              {interviewCandidates.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">Inga kandidater</p>
              )}
            </div>
          </div>

          {/* Hired Column */}
          <div className="bg-green-50 rounded-lg p-4">
            <h2 className="font-bold text-lg mb-3 flex items-center justify-between">
              <span>✅ Anställd</span>
              <span className="bg-green-300 text-green-700 px-2 py-1 rounded text-sm">
                {hiredCandidates.length}
              </span>
            </h2>
            <div className="space-y-3">
              {hiredCandidates.map(candidate => (
                <CandidateCard
                  key={candidate.candidate_id}
                  candidate={candidate}
                  jobTitle={getJobTitle(candidate.job_id)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteCandidate}
                />
              ))}
              {hiredCandidates.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">Inga kandidater</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <a href="/dashboard" className="text-blue-600 hover:underline">
          ← Tillbaka till Dashboard
        </a>
      </div>
    </div>
  );
}

function CandidateCard({ 
  candidate, 
  jobTitle, 
  onStatusChange, 
  onDelete 
}: { 
  candidate: Candidate;
  jobTitle: string;
  onStatusChange: (id: string, status: 'applied' | 'interview' | 'hired') => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white p-3 rounded shadow-sm border">
      <h3 className="font-semibold">{candidate.name}</h3>
      <p className="text-xs text-gray-500 mt-1">{jobTitle}</p>
      
      {candidate.linkedin && (
        <a 
          href={candidate.linkedin} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline mt-1 block"
        >
          LinkedIn →
        </a>
      )}
      
      <div className="mt-3 flex gap-1">
        {candidate.status !== 'applied' && (
          <button
            onClick={() => onStatusChange(candidate.candidate_id, 'applied')}
            className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
            title="Flytta till Ansökt"
          >
            ←
          </button>
        )}
        {candidate.status !== 'interview' && (
          <button
            onClick={() => onStatusChange(candidate.candidate_id, 'interview')}
            className="text-xs bg-blue-200 px-2 py-1 rounded hover:bg-blue-300"
            title="Flytta till Intervju"
          >
            💼
          </button>
        )}
        {candidate.status !== 'hired' && (
          <button
            onClick={() => onStatusChange(candidate.candidate_id, 'hired')}
            className="text-xs bg-green-200 px-2 py-1 rounded hover:bg-green-300"
            title="Flytta till Anställd"
          >
            →
          </button>
        )}
        <button
          onClick={() => onDelete(candidate.candidate_id)}
          className="text-xs bg-red-200 px-2 py-1 rounded hover:bg-red-300 ml-auto"
          title="Ta bort"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}