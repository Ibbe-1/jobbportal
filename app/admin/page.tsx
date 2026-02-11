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

  // ==================== DELETE USER ====================

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
      fetchJobs();
      fetchCandidates();
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Kontrollerar behörighet...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">⚙️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-sm text-slate-500">Inloggad som <span className="font-medium text-slate-700">{currentUser.email}</span></p>
              </div>
            </div>
            <a 
              href="/dashboard" 
              className="text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
            >
              <span>←</span> Dashboard
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Totalt Användare</p>
                <p className="text-3xl font-bold text-slate-800">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Aktiva Jobb</p>
                <p className="text-3xl font-bold text-slate-800">{jobs.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Kandidater</p>
                <p className="text-3xl font-bold text-slate-800">{candidates.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="mr-2">👥</span>
              Användare
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'jobs'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="mr-2">💼</span>
              Jobb
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'candidates'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="mr-2">📋</span>
              Kandidater
            </button>
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Hantera Användare</h2>
              <button
                onClick={() => setShowUserForm(!showUserForm)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-sm ${
                  showUserForm
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                }`}
              >
                {showUserForm ? '✕ Avbryt' : '+ Ny Användare'}
              </button>
            </div>

            {showUserForm && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                <h3 className="font-bold text-xl mb-6 text-slate-800">Skapa Ny Användare</h3>
                <form onSubmit={handleCreateUser} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Email *</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                        required
                        disabled={creating}
                        placeholder="namn@example.com"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Lösenord *</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                        required
                        disabled={creating}
                        minLength={6}
                        placeholder="Minst 6 tecken"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Roll *</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'customer'})}
                        className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
                        disabled={creating}
                      >
                        <option value="customer">Kund</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 transition-all shadow-sm"
                  >
                    {creating ? 'Skapar...' : 'Skapa Användare'}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Roll</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Skapad</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-800 font-medium">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {user.role === 'admin' ? '⚡' : '👤'} {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(user.created_at).toLocaleDateString('sv-SE')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleChangeRole(user.user_id, user.email, user.role === 'admin' ? 'customer' : 'admin')}
                              className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium border border-amber-200"
                              disabled={deleting === user.user_id}
                            >
                              → {user.role === 'admin' ? 'Kund' : 'Admin'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.user_id, user.email)}
                              disabled={deleting === user.user_id}
                              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:bg-slate-50 disabled:text-slate-400 transition-colors text-sm font-medium border border-red-200"
                            >
                              {deleting === user.user_id ? 'Tar bort...' : '🗑️ Ta bort'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Hantera Jobb</h2>
              <button
                onClick={() => setShowJobForm(!showJobForm)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-sm ${
                  showJobForm
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                }`}
              >
                {showJobForm ? '✕ Avbryt' : '+ Nytt Jobb'}
              </button>
            </div>

            {showJobForm && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                <h3 className="font-bold text-xl mb-6 text-slate-800">Skapa Nytt Jobb</h3>
                <form onSubmit={handleCreateJob} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Användare *</label>
                      <select
                        value={newJob.user_id}
                        onChange={(e) => setNewJob({...newJob, user_id: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
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
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Titel *</label>
                      <input
                        type="text"
                        value={newJob.title}
                        onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                        required
                        placeholder="t.ex. Senior Developer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-slate-700">Beskrivning</label>
                    <textarea
                      value={newJob.description}
                      onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                      rows={4}
                      placeholder="Beskriv jobbet..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
                  >
                    Skapa Jobb
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Titel</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Användare</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Beskrivning</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Skapad</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {jobs.map((job) => (
                      <tr key={job.job_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">{job.title}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{job.user_email}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                          {job.description || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(job.created_at).toLocaleDateString('sv-SE')}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteJob(job.job_id)}
                            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
                          >
                            🗑️ Ta bort
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Hantera Kandidater</h2>
              <button
                onClick={() => setShowCandidateForm(!showCandidateForm)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-sm ${
                  showCandidateForm
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                }`}
              >
                {showCandidateForm ? '✕ Avbryt' : '+ Ny Kandidat'}
              </button>
            </div>

            {showCandidateForm && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
                <h3 className="font-bold text-xl mb-6 text-slate-800">Skapa Ny Kandidat</h3>
                <form onSubmit={handleCreateCandidate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Jobb *</label>
                      <select
                        value={newCandidate.job_id}
                        onChange={(e) => setNewCandidate({...newCandidate, job_id: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
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
                      <label className="block mb-2 text-sm font-semibold text-slate-700">Namn *</label>
                      <input
                        type="text"
                        value={newCandidate.name}
                        onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                        required
                        placeholder="Kandidatens namn"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-700">LinkedIn</label>
                      <input
                        type="url"
                        value={newCandidate.linkedin}
                        onChange={(e) => setNewCandidate({...newCandidate, linkedin: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
                  >
                    Skapa Kandidat
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Namn</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Jobb</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Användare</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">LinkedIn</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {candidates.map((candidate) => (
                      <tr key={candidate.candidate_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">{candidate.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{candidate.job_title}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{candidate.user_email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            candidate.status === 'applied' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            candidate.status === 'interview' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {candidate.status === 'applied' && '📩'}
                            {candidate.status === 'interview' && '💬'}
                            {candidate.status === 'hired' && '✅'}
                            {' '}{candidate.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {candidate.linkedin ? (
                            <a
                              href={candidate.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                            >
                              Visa profil →
                            </a>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteCandidate(candidate.candidate_id)}
                            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
                          >
                            🗑️ Ta bort
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}