import React, { useState, useRef, useEffect } from 'react'

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [chatHeight, setChatHeight] = useState('85vh')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatContainerRef = useRef(null)

  const faqs = [
    {
      question: "What is CareerPath?",
      keywords: ["what is", "about", "platform", "tell me about", "careerpath"],
      answer: "CareerPath is an AI-powered platform that helps students discover their ideal career path. We analyze your resume, assess your skills, provide career recommendations, and suggest personalized learning roadmaps."
    },
    {
      question: "What is working?",
      keywords: ["working", "function", "what does it do", "features"],
      answer: "Resume upload and AI analysis, Skill extraction and review, Skill rating with adaptive tests, Career matching with match scores, Learning Resources access, Course recommendations, Trainer finding (Member, Regular, Personalized), Mock Interview practice, Expert Path for advanced students, Learning Roadmap generation"
    },
    {
      question: "Is CareerPath free?",
      keywords: ["free", "cost", "money", "price", "pay", "charge"],
      answer: "Yes! CareerPath is free but some aspects may charge for students as courses enrollment or conversation with trainer."
    },
    {
      question: "How does it work?",
      keywords: ["work", "process", "steps", "how"],
      answer: "Upload your resume or register manually. AI extracts and analyzes your skills. Rate your skills and take adaptive tests. Get personalized career matches and learning recommendations."
    },
    {
      question: "What if I don't have a resume?",
      keywords: ["no resume", "without resume", "don't have resume", "no cv"],
      answer: "You can register directly on our platform. After registration, you can manually enter your skills and proceed with skill review, rating, and assessment. You can also access Learning Resources directly."
    },
    {
      question: "Do I need to create an account?",
      keywords: ["account", "signup", "register", "login", "password"],
      answer: "No! You can simply upload your resume and get started. We verify you using OTP sent to your email or phone. Registering is optional."
    },
    {
      question: "How do I upload my resume?",
      keywords: ["upload", "resume upload", "how to upload", "submit resume"],
      answer: "Click 'Upload Resume' on the landing page. Select your PDF file (max 5MB). AI analyzes and extracts your skills. Proceed to skill review and rating."
    },
    {
      question: "What file formats are supported?",
      keywords: ["file", "format", "pdf", "doc", "docx"],
      answer: "We support PDF format only. File size should be under 5MB."
    },
    {
      question: "What is skill review?",
      keywords: ["skill review", "review skills", "confirm skills", "edit skills"],
      answer: "You see a list of skills extracted by AI. You can review, edit, delete, or add new skills. Then confirm the list is correct."
    },
    {
      question: "How does skill rating work?",
      keywords: ["skill rating", "rate skills", "rating scale", "self rating"],
      answer: "Rate each skill from 1 to 10. 1 to 4 is Basic level. 5 to 7 is Intermediate level. 8 to 10 is Advanced level. This determines your adaptive test difficulty."
    },
    {
      question: "What are adaptive tests?",
      keywords: ["adaptive test", "skill test", "assessment", "exam", "questions"],
      answer: "Tests that match your skill level. Basic rating gives easy questions. Intermediate gives medium questions. Advanced gives challenging questions. Each test has 5 multiple-choice questions per skill."
    },
    {
      question: "Can I retake the assessment?",
      keywords: ["retake", "again", "repeat", "redo", "retest"],
      answer: "Yes! You can retake the skill assessment anytime to keep your recommendations up-to-date."
    },
    {
      question: "What happens after a test?",
      keywords: ["test complete", "result", "score", "after test"],
      answer: "You see your score immediately, can review each question with correct answers, and get recommendations based on your performance."
    },
    {
      question: "What happens after all tests?",
      keywords: ["after all tests", "complete all", "finished tests", "all done"],
      answer: "You get a complete skill analysis report, personalized course recommendations, access to Learning Resources, career matches with scores, and can find trainers."
    },
    {
      question: "What is the dashboard?",
      keywords: ["dashboard", "student dashboard", "progress", "home page"],
      answer: "Your central hub to view progress, see available assessments, track completed tests, access Learning Resources, find trainers, and view skill analysis."
    },
    {
      question: "How accurate are career recommendations?",
      keywords: ["accurate", "reliable", "trust", "correct", "match"],
      answer: "Our AI provides 85%+ accurate career recommendations based on your skills, experience, and interests. Accuracy improves with more data."
    },
    {
      question: "What career paths can I explore?",
      keywords: ["career", "path", "options", "roles", "jobs"],
      answer: "Technology, Business, Creative, Healthcare, Education, and many more. You receive personalized matches based on your unique skill profile."
    },
    {
      question: "What are Learning Resources?",
      keywords: ["learning resources", "content", "courses", "materials"],
      answer: "A dedicated page where you can explore content from trainers, access recommended courses, view videos and PDFs, get personalized recommendations, and find trainers."
    },
    {
      question: "Can I access Learning Resources without a resume?",
      keywords: ["directly access", "without resume", "skip upload", "no resume needed"],
      answer: "Yes! Just click the 'Learning Resources' button on the homepage. No resume needed."
    },
    {
      question: "How does course recommendation work?",
      keywords: ["course", "recommendation", "suggest", "learn", "training"],
      answer: "After tests, we identify your skill gaps and find best courses from platforms like Coursera, Udemy, and edX based on your test results and learning goals."
    },
    {
      question: "Can I download analysis results?",
      keywords: ["download", "export", "pdf", "report", "save"],
      answer: "Yes! Download a complete PDF report with skill analysis, career matches, skill gaps, course recommendations, and learning roadmap."
    },
    {
      question: "What types of trainers are available?",
      keywords: ["trainer", "types", "categories", "kinds", "coach"],
      answer: "Three types: Member Trainers are our in-house trainers. Regular Trainers do group sessions and video content. Personalized Trainers offer one-on-one coaching with custom plans."
    },
    {
      question: "How do I find trainers?",
      keywords: ["find trainer", "connect trainer", "contact trainer", "trainer"],
      answer: "Go to Learning Resources page, click 'Trainers' tab, search by name or specialty, view profiles, and click 'Connect' to start a conversation."
    },
    {
      question: "What is the difference between regular and personalized trainers?",
      keywords: ["regular trainer", "personalized trainer", "difference", "regular vs personalized"],
      answer: "Regular: Group sessions, video content, multiple students. Personalized: One-on-one coaching, custom learning plans, individual progress tracking."
    },
    {
      question: "What are Member Trainers?",
      keywords: ["member trainer", "in-house trainer", "our trainer"],
      answer: "Member Trainers are our in-house trainers who provide quality content and guidance. They are part of the CareerPath team."
    },
    {
      question: "What is Mock Interview?",
      keywords: ["mock interview", "practice", "interview", "prepare"],
      answer: "A practice tool where you select your target job role, get AI-generated interview questions, type your answers, receive feedback, and get improvement suggestions."
    },
    {
      question: "What is Expert Path?",
      keywords: ["expert path", "expert", "advanced", "aptitude", "reasoning"],
      answer: "For students scoring 90%+ in tests. Provides aptitude development, logical reasoning practice, communication courses, leadership programs, and soft skill resources."
    },
    {
      question: "How does AI analyze my resume?",
      keywords: ["analyze", "extract", "scan", "ai", "process"],
      answer: "AI extracts your name, contact info, technical and soft skills, work experience, education, certifications, and projects. Then matches with our career database."
    },
    {
      question: "Is my data safe?",
      keywords: ["safe", "secure", "privacy", "data", "protection"],
      answer: "Yes! Your data is encrypted, stored securely, never shared with third parties, and you can delete it anytime."
    },
    {
      question: "What is the Learning Roadmap?",
      keywords: ["learning roadmap", "roadmap", "learning plan", "study plan"],
      answer: "A 4-phase plan. Phase 1: Foundation (Weeks 1-2). Phase 2: Intermediate (Weeks 3-4). Phase 3: Advanced (Weeks 5-8). Phase 4: Specialization (Weeks 9-12). Includes recommended courses and resources."
    },
    {
      question: "Can I become a trainer?",
      keywords: ["trainer", "become", "teacher", "instructor", "mentor"],
      answer: "Yes! Register as a trainer, get admin approval, then create sessions, upload videos, and help students learn. Both regular and personalized training options available."
    },
    {
      question: "What is the student journey?",
      keywords: ["journey", "process", "steps", "flow", "full process"],
      answer: "Resume Upload or Registration, Skill Review, Skill Rating, Adaptive Tests, Results Dashboard, Career Matching, Course Recommendations, Learning Resources, Find Trainers, Track Progress"
    },
    {
      question: "What is the difference between upload and register?",
      keywords: ["upload vs register", "difference upload register", "upload or register"],
      answer: "Upload: You upload your resume and AI extracts your skills automatically. Register: You manually enter your details and skills without uploading a resume. Both lead to the same career guidance journey."
    },
    {
      question: "How long does the whole process take?",
      keywords: ["how long", "time", "duration", "minutes", "hours"],
      answer: "The complete process from resume upload to getting recommendations takes about 10-15 minutes. You can also come back anytime to continue from where you left off."
    },
    {
      question: "Can I skip a test?",
      keywords: ["skip", "skip test", "skip assessment", "skip questions"],
      answer: "No, you cannot skip a test. You need to complete the test to get accurate career recommendations and course suggestions."
    },
    {
      question: "What happens if I fail a test?",
      keywords: ["fail", "failed", "low score", "bad score"],
      answer: "There is no pass or fail. Your score determines your proficiency level and helps us recommend appropriate courses. Lower scores mean you'll get beginner-friendly course recommendations."
    },
    {
      question: "Can I change my skill rating after saving?",
      keywords: ["change rating", "edit rating", "modify rating", "update rating"],
      answer: "Yes! You can go back and retake the skill assessment anytime. Your new ratings will update your recommendations."
    },
    {
      question: "What is OTP verification?",
      keywords: ["otp", "verification", "verify", "code"],
      answer: "OTP (One-Time Password) is a 6-digit code sent to your email or phone. You enter it to verify your identity without needing a password."
    },
    {
      question: "Can I use CareerPath on mobile?",
      keywords: ["mobile", "phone", "android", "ios", "app"],
      answer: "Yes! CareerPath is a web application that works on all mobile browsers. You can access it from your phone, tablet, or laptop."
    },
    {
      question: "Do I need technical skills to use CareerPath?",
      keywords: ["technical skills", "tech skills", "beginner", "easy"],
      answer: "No! CareerPath is designed for all students. You don't need any technical skills. Just upload your resume or register and follow the simple steps."
    },
    {
      question: "What if I don't know my skill level?",
      keywords: ["don't know", "not sure", "confused", "skill level"],
      answer: "That's okay! Just estimate your skill level honestly. You can always retake the assessment later. Our adaptive tests will help determine your actual level."
    }
  ]

  const suggestions = [
    "What is CareerPath?",
    "How does it work?",
    "What if I don't have a resume?",
    "Is it free?"
  ]

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          type: 'bot',
          text: "Hi! How may I help you today?",
          timestamp: new Date()
        }
      ])
      setShowSuggestions(true)
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const viewport = window.visualViewport
        const windowHeight = window.innerHeight
        const keyboardHeight = windowHeight - viewport.height
        
        if (keyboardHeight > 100) {
          // Keyboard is open - set height to remaining viewport
          setChatHeight(`${viewport.height}px`)
        } else {
          // Keyboard is closed - reset to normal height
          if (window.innerWidth < 640) {
            setChatHeight('85vh')
          } else {
            setChatHeight('550px')
          }
        }
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange)
      window.visualViewport.addEventListener('scroll', handleViewportChange)
    }

    // Also handle regular resize as fallback
    const handleResize = () => {
      if (!window.visualViewport) {
        const isMobile = window.innerWidth < 640
        if (isMobile) {
          // Simple detection - if height is less than 80% of screen height, keyboard is open
          const isKeyboardOpen = window.innerHeight < window.screen.height * 0.8
          if (isKeyboardOpen) {
            setChatHeight(`${window.innerHeight}px`)
          } else {
            setChatHeight('85vh')
          }
        } else {
          setChatHeight('550px')
        }
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange)
        window.visualViewport.removeEventListener('scroll', handleViewportChange)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Handle focus to scroll input into view
  const handleInputFocus = () => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 300)
  }

  const getResponse = (userInput) => {
    const input = userInput.toLowerCase().trim()

    if (input.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return "Hello! How may I help you today?"
    }

    if (input.match(/^(thanks|thank you|thankyou|thx)/)) {
      return "You're welcome! Is there anything else I can help with?"
    }

    if (input.match(/^(yes|yeah|sure|ok|okay|yep)/)) {
      return "What would you like to know?"
    }

    if (input.match(/^(no|nope|not|nah)/)) {
      return "Let me know if you have any other questions."
    }

    if (input.match(/^(bye|goodbye|see you|farewell)/)) {
      return "Goodbye! Come back anytime."
    }

    if (input.match(/^(help|what can you do|capabilities)/)) {
      return "I can help with: Resume Upload & Analysis, Registration (no resume), Skill Review & Rating, Adaptive Testing, Career Matching, Learning Resources, Course Recommendations, Finding Trainers, Mock Interview, Expert Path, Learning Roadmap."
    }

    let bestMatch = null
    let highestScore = 0

    for (const faq of faqs) {
      let score = 0
      for (const keyword of faq.keywords) {
        if (input.includes(keyword)) {
          score += 1
        }
      }
      if (score > highestScore) {
        highestScore = score
        bestMatch = faq
      }
    }

    if (bestMatch && highestScore >= 1) {
      return bestMatch.answer
    }

    return "I can help with: What is CareerPath? How does it work? What if I don't have a resume? Is it free? What is the student journey? How do I find trainers? What happens after tests? Can I become a trainer? Please ask about any of these."
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    setShowSuggestions(false)

    setTimeout(() => {
      const response = getResponse(input.trim())
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: response,
        timestamp: new Date()
      }])
      setIsTyping(false)
    }, 600)
  }

  const handleSuggestionClick = (text) => {
    setInput(text)
    setTimeout(() => handleSend(), 100)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center group"
        >
          <span className="text-2xl sm:text-3xl group-hover:animate-bounce">🤖</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {isOpen && (
        <div 
          ref={chatContainerRef}
          className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-auto sm:right-6 bg-white sm:rounded-2xl shadow-2xl border-t sm:border border-gray-200 z-50 flex flex-col"
          style={{
            height: chatHeight,
            maxHeight: window.innerWidth < 640 ? '85vh' : '550px',
            width: window.innerWidth < 640 ? '100%' : '400px'
          }}
        >
          {/* Fixed Header - stays at top */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="font-semibold">Career Assistant</span>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1"></span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false)
                setMessages([])
                setShowSuggestions(true)
                if (inputRef.current) {
                  inputRef.current.blur()
                }
              }}
              className="hover:bg-white/20 p-1 rounded transition text-xl"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.type === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions - Fixed below messages */}
          {showSuggestions && messages.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((text, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(text)}
                    className="text-xs bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 transition"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fixed Input Area - stays at bottom */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder="Type your question..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Chatbot