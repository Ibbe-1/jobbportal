"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface User {
  user_id: string;
  email: string;
  role: 'admin' | 'customer';
  created_at: string;
}

interface Job {
  job_id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  user_email?: string;
}

interface Candidate {
  candidate_id: string;
  job_id: string;
  name: string;
  linkedin: string | null;
  status: 'applied' | 'interview' | 'hired';
  created_at: string;
  job_title?: string;
  user_email?: string;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'candidates'>('users');
  
  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'customer' as 'admin' | 'customer',
  });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState({
    user_id: '',
    title: '',
    description: '',
  });

  // Candidates
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    job_id: '',
    name: '',
    linkedin: '',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Kolla om användaren är admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      alert("Du måste vara admin för att komma åt denna sida");
      window.location.href = "/dashboard";
      return;
    }

    setCurrentUser(user);
    setAuthChecked(true);
  };

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchJobs();
      fetchCandidates();
    }
  }, [currentUser]);

  // ==================== FETCH DATA ====================

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data || []);
    }
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        *,
        users!inner(email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      const jobsWithEmail = data?.map((job: any) => ({
        ...job,
        user_email: job.users?.email || 'Okänd',
      })) || [];
      setJobs(jobsWithEmail);
    }
  };

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select(`
        *,
        jobs!inner(title, user_id, users!inner(email))
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching candidates:", error);
    } else {
      const candidatesWithDetails = data?.map((candidate: any) => ({
        ...candidate,
        job_title: candidate.jobs?.title || 'Okänt jobb',
        user_email: candidate.jobs?.users?.email || 'Okänd',
      })) || [];
      setCandidates(candidatesWithDetails);
    }
  };

  // ==================== CREATE USER ====================

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.email || !newUser.password) {
      alert("Fyll i alla fält");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      alert(`Användare ${newUser.email} skapad som ${newUser.role}!`);
      setNewUser({ email: '', password: '', role: 'customer' });
      setShowUserForm(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert('Kunde inte skapa användare: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // ==================== CREATE JOB ====================

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newJob.user_id || !newJob.title) {
      alert("Fyll i alla obligatoriska fält");
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .insert([newJob]);

    if (error) {
      console.error("Error creating job:", error);
      alert("Kunde inte skapa jobb: " + error.message);
    } else {
      alert("Jobb skapat!");
      setNewJob({ user_id: '', title: '', description: '' });
      setShowJobForm(false);
      fetchJobs();
    }
  };

  // ==================== CREATE CANDIDATE ====================

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCandidate.job_id || !newCandidate.name) {
      alert("Fyll i alla obligatoriska fält");
      return;
    }

    const { error } = await supabase
      .from("candidates")
      .insert([{
        ...newCandidate,
        linkedin: newCandidate.linkedin || null,
        status: 'applied',
      }]);

    if (error) {
      console.error("Error creating candidate:", error);
      alert("Kunde inte skapa kandidat: " + error.message);
    } else {
      alert("Kandidat skapad!");
      setNewCandidate({ job_id: '', name: '', linkedin: '' });
      setShowCandidateForm(false);
      fetchCandidates();
    }
  };

  // ==================== DELETE USER (UPDATED) ====================

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Är du säker på att du vill ta bort användaren ${email}? Detta tar även bort alla deras jobb och kandidater.`)) {
      return;
    }

    setDeleting(userId);

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      alert(`Användare ${email} borttagen helt!`);
      fetchUsers();
      fetchJobs(); // Uppdatera jobs också
      fetchCandidates(); // Uppdatera candidates också
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Kunde inte ta bort användare: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  // ==================== DELETE JOB ====================

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
      alert("Jobb borttaget!");
      fetchJobs();
      fetchCandidates();
    }
  };

  // ==================== DELETE CANDIDATE ====================

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
      alert("Kandidat borttagen!");
      fetchCandidates();
    }
  };

  // ==================== CHANGE ROLE ====================

  const handleChangeRole = async (userId: string, currentEmail: string, newRole: 'admin' | 'customer') => {
    if (!confirm(`Vill du ändra ${currentEmail} till ${newRole}?`)) return;

    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      console.error("Error changing role:", error);
      alert("Kunde inte ändra roll");
    } else {
      alert("Roll uppdaterad!");
      fetchUsers();
    }
  };

  if (!authChecked) {
    return <div className="p-10">Kontrollerar behörighet...</div>;
  }

  if (!currentUser) {
    return <div className="p-10">Laddar...</div>;
  }

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🔧 Admin Panel</h1>
        <p className="text-gray-600">Inloggad som: <strong>{currentUser.email}</strong></p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👥 Användare ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'jobs'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          💼 Jobb ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-6 py-3 font-semibold ${
            activeTab === 'candidates'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📋 Kandidater ({candidates.length})
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Hantera Användare</h2>
            <button
              onClick={() => setShowUserForm(!showUserForm)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {showUserForm ? 'Avbryt' : '+ Ny Användare'}
            </button>
          </div>

          {showUserForm && (
            <div className="bg-white p-6 rounded shadow mb-6">
              <h3 className="font-bold text-lg mb-4">Skapa Ny Användare</h3>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-semibold">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="border w-full px-3 py-2 rounded"
                    required
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold">Lösenord *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="border w-full px-3 py-2 rounded"
                    required
                    disabled={creating}
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold">Roll *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'customer'})}
                    className="border w-full px-3 py-2 rounded"
                    disabled={creating}
                  >
                    <option value="customer">Kund</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {creating ? 'Skapar...' : 'Skapa Användare'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skapad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleChangeRole(user.user_id, user.email, user.role === 'admin' ? 'customer' : 'admin')}
                          className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200"
                          disabled={deleting === user.user_id}
                        >
                          → {user.role === 'admin' ? 'Kund' : 'Admin'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.user_id, user.email)}
                          disabled={deleting === user.user_id}
                          className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 disabled:bg-red-50 disabled:text-red-400"
                        >
                          {deleting === user.user_id ? 'Tar bort...' : 'Ta bort'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Jobs Tab - samma som tidigare */}
      {activeTab === 'jobs' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Hantera Jobb</h2>
            <button
              onClick={() => setShowJobForm(!showJobForm)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {showJobForm ? 'Avbryt' : '+ Nytt Jobb'}
            </button>
          </div>

          {showJobForm && (
            <div className="bg-white p-6 rounded shadow mb-6">
              <h3 className="font-bold text-lg mb-4">Skapa Nytt Jobb</h3>
              <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-semibold">Användare *</label>
                  <select
                    value={newJob.user_id}
                    onChange={(e) => setNewJob({...newJob, user_id: e.target.value})}
                    className="border w-full px-3 py-2 rounded"
                    required
                  >
                    <option value="">Välj användare</option>
                    {users.map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold">Titel *</label>
                  <input
                    type="text"
                    value={newJob.title}
                    onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                    className="border w-full px-3 py-2 rounded"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-semibold">Beskrivning</label>
                  <textarea
                    value={newJob.description}
                    onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                    className="border w-full px-3 py-2 rounded"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    Skapa Jobb
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Användare</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beskrivning</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skapad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.job_id}>
                    <td className="px-6 py-4 font-semibold">{job.title}</td>
                    <td className="px-6 py-4 text-sm">{job.user_email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {job.description?.substring(0, 50)}
                      {job.description && job.description.length > 50 ? '...' : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteJob(job.job_id)}
                        className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                      >
                        Ta bort
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidates Tab - samma som tidigare */}
      {activeTab === 'candidates' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Hantera Kandidater</h2>
            <button
              onClick={() => setShowCandidateForm(!showCandidateForm)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {showCandidateForm ? 'Avbryt' : '+ Ny Kandidat'}
            </button>
          </div>

          {showCandidateForm && (
            <div className="bg-white p-6 rounded shadow mb-6">
              <h3 className="font-bold text-lg mb-4">Skapa Ny Kandidat</h3>
              <form onSubmit={handleCreateCandidate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-semibold">Jobb *</label>
                  <select
                    value={newCandidate.job_id}
                    onChange={(e) => setNewCandidate({...newCandidate, job_id: e.target.value})}
                    className="border w-full px-3 py-2 rounded"
                    required
                  >
                    <option value="">Välj jobb</option>
                    {jobs.map((job) => (
                      <option key={job.job_id} value={job.job_id}>
                        {job.title} - {job.user_email}
                      </option>
                    ))}
                  </select>
                </div>
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
                    Skapa Kandidat
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Namn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jobb</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Användare</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LinkedIn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.candidate_id}>
                    <td className="px-6 py-4 font-semibold">{candidate.name}</td>
                    <td className="px-6 py-4 text-sm">{candidate.job_title}</td>
                    <td className="px-6 py-4 text-sm">{candidate.user_email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        candidate.status === 'applied' ? 'bg-gray-100 text-gray-800' :
                        candidate.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {candidate.linkedin ? (
                        <a
                          href={candidate.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Visa profil
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteCandidate(candidate.candidate_id)}
                        className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                      >
                        Ta bort
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8">
        <a href="/dashboard" className="text-blue-600 hover:underline">
          ← Tillbaka till Dashboard
        </a>
      </div>
    </div>
  );
}