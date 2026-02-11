// src/app/page.tsx
export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
        style={{
          backgroundSize: '400% 400%',
          animation: 'gradient-xy 15s ease infinite'
        }}
      ></div>
      
      {/* Overlay pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAtMjBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6TTIwIDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wLTIwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
      
      {/* Glassmorphism container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-12 max-w-4xl w-full">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
              <span className="text-5xl">💼</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white text-center mb-4 drop-shadow-lg">
            Välkommen till <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">mini-ATS</span>
          </h1>
          
          <p className="text-xl text-white/90 text-center mb-12 max-w-2xl mx-auto drop-shadow">
            Din moderna plattform för rekrytering och kandidathantering
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Kandidater</h3>
              <p className="text-white/80 text-sm">Hantera och spåra alla dina kandidater på ett ställe</p>
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Dashboard</h3>
              <p className="text-white/80 text-sm">Överblick över alla dina rekryteringsprocesser</p>
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Jobb</h3>
              <p className="text-white/80 text-sm">Skapa och publicera tjänster enkelt</p>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="group relative px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300"></div>
              <div className="relative flex items-center justify-center gap-2 text-white">
                <span>🔐</span>
                <span>Logga in</span>
              </div>
            </a>

            <a
              href="/dashboard"
              className="group relative px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-700 group-hover:from-emerald-600 group-hover:to-emerald-800 transition-all duration-300"></div>
              <div className="relative flex items-center justify-center gap-2 text-white">
                <span>📊</span>
                <span>Dashboard</span>
              </div>
            </a>

            <a
              href="/jobs"
              className="group relative px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-700 group-hover:from-purple-600 group-hover:to-purple-800 transition-all duration-300"></div>
              <div className="relative flex items-center justify-center gap-2 text-white">
                <span>💼</span>
                <span>Mina Jobb</span>
              </div>
            </a>
          </div>

          {/* Footer text */}
          <div className="mt-12 text-center">
            <p className="text-white/60 text-sm">
              Effektivisera din rekryteringsprocess idag
            </p>
          </div>
        </div>

        {/* Floating elements */}
        <div 
          className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"
          style={{ animation: 'float 6s ease-in-out infinite' }}
        ></div>
        <div 
          className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"
          style={{ animation: 'float-delayed 8s ease-in-out infinite' }}
        ></div>
        <div 
          className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl"
          style={{ animation: 'float-slow 10s ease-in-out infinite' }}
        ></div>
      </div>
    </div>
  );
}