import React, { useState } from 'react'

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const faqs = [
    {
      question: "Is CareerPath free?",
      answer: "Yes! CareerPath is free but some aspects may charge for students as courses enrollment or conversation with trainer."
    },
    {
      question: "What is working?",
      answer: "Resume upload and AI analysis, Skill extraction and review, Skill rating with adaptive tests, Career matching with match scores, Learning Resources access, Course recommendations, Trainer finding (Member, Regular, Personalized), Mock Interview practice, Expert Path for advanced students, Learning Roadmap generation"
    },
    {
      question: "Can I upload multiple resumes?",
      answer: "Yes! You can upload and manage multiple resumes. Each resume will be analyzed separately and you can track progress for different career paths."
    },
    {
      question: "What is the difference between upload and register?",
      answer: "Upload: You upload your resume and AI extracts your skills automatically. Register: You manually enter your details and skills without uploading a resume. Both lead to the same career guidance journey."
    },
    {
      question: "Can I access Learning Resources without a resume?",
      answer: "Yes! Just click the 'Learning Resources' button on the homepage. No resume needed."
    },
    {
      question: "How does course recommendation work?",
      answer: "After tests, we identify your skill gaps and find best courses from platforms based on your test results and learning goals."
    },
    {
      question: "Is my data safe and secure?",
      answer: "Absolutely! Your resume data is stored securely in our database. We use industry-standard encryption and never share your personal information with third parties."
    }
  ]

  return (
    <section id="faq" className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2]">Questions</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-lg">
            Everything you need to know about Career Pathfinder
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 overflow-hidden">
              <button onClick={() => toggleFAQ(index)} className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition">
                <span className="text-base font-medium text-gray-800">{faq.question}</span>
                <span className={`text-gray-400 text-xl transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>▼</span>
              </button>
              <div className={`px-6 overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 pb-5' : 'max-h-0'}`}>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ