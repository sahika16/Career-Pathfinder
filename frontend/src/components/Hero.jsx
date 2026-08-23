import React from 'react'

function Hero({ onUploadClick }) {
  // Function to scroll to How It Works section
  const scrollToHowItWorks = () => {
    const section = document.getElementById('how-it-works')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] relative overflow-hidden">
      {/* Animated Floating Circles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-[#f093fb] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#4facfe] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#43e97b] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1400"></div>
        <div className="absolute top-20 right-20 w-40 h-40 bg-[#fa709a] rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse delay-2100"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-[10%] text-4xl animate-bounce"></div>
        <div className="absolute top-20 right-[15%] text-3xl animate-bounce delay-300"></div>
        <div className="absolute top-1/2 left-[5%] text-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-[5%] text-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-block bg-white/20 backdrop-blur-xl px-8 py-3 rounded-full mb-8 border border-white/30 shadow-xl">
          <span className="text-white font-bold tracking-wider">Skill based CAREER GUIDANCE</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
          Discover Your Perfect
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fddb92] via-[#d1fdff] to-[#fddb92] block animate-gradient">Career Path</span>
        </h1>
        
        <p className="text-xl text-white/95 mt-6 max-w-2xl mx-auto font-light">
          Upload your resume and let analyze your skills, identify gaps, and create a personalized learning roadmap for your dream career.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-5">
          <button 
            onClick={onUploadClick} 
            className="group relative px-10 py-4 rounded-full text-lg font-bold text-gray-900 bg-white hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3 overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#fddb92] to-[#f093fb] opacity-0 group-hover:opacity-100 transition duration-300"></span>
            <span className="relative z-10 flex items-center space-x-3">
              <span>📤</span>
              <span>Upload Resume</span>
            </span>
          </button>
          <button 
            onClick={scrollToHowItWorks}
            className="px-10 py-4 rounded-full text-lg font-semibold text-white border-2 border-white/50 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105 cursor-pointer"
          >
            <span>▶</span>
            <span>How It Works</span>
          </button>
        </div>
        
        <div className="mt-16 flex flex-wrap justify-center gap-6">
          <div className="group bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-default">
            <span className="text-white font-medium flex items-center space-x-2">
              <span className="text-2xl group-hover:scale-110 transition">🤖</span>
              <span>AI-Powered Analysis</span>
            </span>
          </div>
          <div className="group bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-default">
            <span className="text-white font-medium flex items-center space-x-2">
              <span className="text-2xl group-hover:scale-110 transition">📊</span>
              <span>Skill Gap Detection</span>
            </span>
          </div>
          <div className="group bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-default">
            <span className="text-white font-medium flex items-center space-x-2">
              <span className="text-2xl group-hover:scale-110 transition">🎯</span>
              <span>Career Matching</span>
            </span>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center items-center gap-8">
          <div className="flex items-center space-x-2 text-white/90">
            <span className="text-yellow-300 text-2xl">★★★★★</span>
            <span className="font-medium">4.9/5 Rating</span>
          </div>
          <div className="w-px h-8 bg-white/30"></div>
          <div className="flex items-center space-x-2 text-white/90">
            <span className="text-2xl">👥</span>
            <span className="font-medium">10K+ Students</span>
          </div>
          <div className="w-px h-8 bg-white/30"></div>
          <div className="flex items-center space-x-2 text-white/90">
            <span className="text-2xl">🎓</span>
            <span className="font-medium">100% Free</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero