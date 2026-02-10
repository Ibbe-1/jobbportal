"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Job {
  job_id: string;
  title: string;
  description: string;
  created_at: string;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [user, setUser] = useState<any>(null);

  // Kolla om användaren är inloggad
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Jobs page - User check:", user);
      
      if (!user) {
        console.log("No user found, redirecting to login");
        router.push("/login");
        return;
      }
      
      setUser(user);
    };
    
    checkUser();
  }, [router]);

  const fetchJobs = async () => {
    setLoading(true);
    console.log("Fetching jobs...");
    
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      console.log("Jobs fetched:", data);
      setJobs(data as Job[]);
    }
    setLoading(false);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("Du måste vara inloggad");
      return;
    }

    console.log("Creating job:", { title, description, user_id: user.id });

    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          user_id: user.id,
          title,
          description,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating job:", error);
      alert("Kunde inte skapa jobb: " + error.message);
    } else {
      console.log("Job created:", data);
      setTitle("");
      setDescription("");
      setShowForm(false);
      fetchJobs();
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Är du säker på att du vill ta bort detta jobb?")) return;

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("job_id", jobId);

    if (error) {
      console.error("Error deleting job:", error);
      alert("Kunde inte ta bort jobb: " + error.message);
    } else {
      fetchJobs();
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-10 max-w-2xl mx-auto">
        <p>Kontrollerar inloggning...</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-10 max-w-2xl mx-auto">Laddar jobb...</div>;
  }

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-bold">Mina Jobb</h1>
          <p className="text-sm text-gray-500">Inloggad som: {user.email}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {showForm ? "Avbryt" : "+ Nytt Jobb"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateJob} className="bg-white p-5 rounded shadow mb-5">
          <div className="mb-3">
            <label className="block mb-1 font-semibold">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border w-full px-3 py-2 rounded"
              required
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-semibold">Beskrivning</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border w-full px-3 py-2 rounded"
              rows={4}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Skapa Jobb
          </button>
        </form>
      )}

      {jobs.length === 0 && <p>Inga jobb än. Skapa ditt första jobb!</p>}
      
      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.job_id} className="border p-4 rounded bg-white shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="font-bold text-lg">{job.title}</h2>
                <p className="text-gray-600 mt-1">{job.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Skapad: {new Date(job.created_at).toLocaleDateString('sv-SE')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/jobs/${job.job_id}`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Visa
                </button>
                <button
                  onClick={() => handleDeleteJob(job.job_id)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  Ta bort
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <a href="/dashboard" className="text-blue-600 hover:underline">
          ← Tillbaka till Dashboard
        </a>
      </div>
    </div>
  );
}