import React from 'react'

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: "📤",
      title: "Upload Resume",
      description: "Upload your resume in PDF format and let us extract your skills",
      gradient: "from-[#667eea] to-[#764ba2]"
    },
    {
      number: "02",
      icon: "🤖",
      title: "Skills Analysis",
      description: "Our AI analyzes your skills and identifies career matches",
      gradient: "from-[#f093fb] to-[#f5576c]"
    },
    {
      number: "03",
      icon: "✅",
      title: "Get Recommendations",
      description: "Receive personalized career path and learning recommendations",
      gradient: "from-[#43e97b] to-[#38f9d7]"
    }
  ]

  return (
    <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
            Process
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-6">
            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f093fb] to-[#f5576c]">Works</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-lg">
            Three simple steps to discover your career path
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-28 left-[16%] right-[16%] h-1 bg-gradient-to-r from-[#667eea] via-[#f093fb] to-[#43e97b] rounded-full"></div>

          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              <div className="relative inline-block">
                <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl relative z-10`}>
                  {step.icon}
                </div>
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-gray-100 z-20">
                  <span className="text-base font-extrabold text-gray-800">{step.number}</span>
                </div>
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.gradient} blur-2xl opacity-20 -z-10`}></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 max-w-xs mx-auto leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks