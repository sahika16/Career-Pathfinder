import React from 'react'

function Features() {
  const features = [
    {
      icon: "🤖",
      title: "AI Skill Analysis",
      description: "Advanced AI extracts and analyzes skills from your resume with high accuracy",
      gradient: "from-[#667eea] to-[#764ba2]"
    },
    {
      icon: "🎯",
      title: "Career Matching",
      description: "Get matched with careers that align with your skills and experience",
      gradient: "from-[#f093fb] to-[#f5576c]"
    },
    {
      icon: "📚",
      title: "Skill Gap Detection",
      description: "Identify missing skills required for your dream career path",
      gradient: "from-[#4facfe] to-[#00f2fe]"
    },
    {
      icon: "📈",
      title: "Learning Roadmap",
      description: "Personalized step-by-step learning plan with course recommendations",
      gradient: "from-[#43e97b] to-[#38f9d7]"
    },
    {
      icon: "👥",
      title: "Mock Interview",
      description: "Practice with AI-generated interview questions and get feedback",
      gradient: "from-[#fa709a] to-[#fee140]"
    },
    {
      icon: "🏆",
      title: "Expert Path",
      description: "Advanced guidance for aptitude, reasoning, and leadership skills",
      gradient: "from-[#a18cd1] to-[#fbc2eb]"
    }
  ]

  return (
    <section id="features" className="py-24 px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
            Features
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-6">
            What Makes Us <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb]">Different</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-lg">
            We combine AI technology with career expertise to give you personalized guidance
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100/50">
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition duration-500`}></div>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition duration-300 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              <div className="mt-5 flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2] group-hover:translate-x-2 transition">
                Learn More →
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features