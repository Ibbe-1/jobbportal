"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Job {
  id: string;
  title: string;
  description: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Fel vid hämtning av jobb:", error.message);
    } else {
      setJobs(data as Job[]);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-5">Mina Jobb</h1>
      {jobs.length === 0 && <p>Inga jobb än.</p>}
      <ul>
        {jobs.map((job) => (
          <li key={job.id} className="border p-3 mb-3 rounded">
            <h2 className="font-bold">{job.title}</h2>
            <p>{job.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
