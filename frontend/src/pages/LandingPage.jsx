import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import FAQ from '../components/FAQ'
import ResumeUpload from '../components/ResumeUpload'
import Footer from '../components/Footer'

function LandingPage({ user, onLogout }) {
  const navigate = useNavigate()
  const [showUpload, setShowUpload] = useState(false)

  const handleUploadClick = () => {
    setShowUpload(true)
    setTimeout(() => {
      document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleUploadSuccess = (data) => {
    console.log('Upload successful:', data)
    navigate(`/skill-review/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        onUploadClick={handleUploadClick}
        user={user}
        onLogout={onLogout}
      />
      
      <Hero onUploadClick={handleUploadClick} />
      <Features />
      <HowItWorks />
      
      <FAQ />
      
      <section id="upload-section" className="py-24 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          {!showUpload ? (
            <>
              <div className="inline-block bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg mb-6">
                Get Started
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
                Ready to Build Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb]">
                  Career?
                </span>
              </h2>
              <p className="text-gray-600 mt-4 mb-10 max-w-2xl mx-auto text-lg">
                Begin your career journey with skill based guidance
              </p>
              <button
                onClick={handleUploadClick}
                className="group relative px-14 py-5 rounded-full text-lg font-bold text-white bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#f093fb] to-[#f5576c] opacity-0 group-hover:opacity-100 transition duration-300"></span>
                <span className="relative z-10 flex items-center space-x-3">
                  <span>🚀</span>
                  <span>Get Started Now</span>
                </span>
              </button>
            </>
          ) : (
            <>
              <div className="inline-block bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg mb-6">
                Upload Resume
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
                Upload Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2]">Resume</span>
              </h2>
              <p className="text-gray-600 mt-4 mb-10 max-w-2xl mx-auto text-lg">
                Upload your resume and let analyze your skill set for career 
              </p>
              <ResumeUpload onUploadSuccess={handleUploadSuccess} />
            </>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  )
}

export default LandingPage