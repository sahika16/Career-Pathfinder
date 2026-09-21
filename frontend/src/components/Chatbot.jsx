import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

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
      keywords: ["what is careerpath", "about careerpath", "about platform", "tell me about careerpath", "careerpath meaning", "what is career path"],
      answer: "CareerPath is an AI-powered platform that helps students discover their ideal career path. We analyze your resume, assess your skills, provide career recommendations, and suggest personalized learning roadmaps."
    },
    {
      question: "What is working?",
      keywords: ["what is working", "what does it do", "features of careerpath", "how does platform work", "function of careerpath"],
      answer: "Resume upload and AI analysis, Skill extraction and review, Skill rating with adaptive tests, Career matching with match scores, Learning Resources access, Course recommendations, Trainer finding (Member, Regular, Personalized), Mock Interview practice, Expert Path for advanced students, Learning Roadmap generation"
    },
    {
      question: "Is CareerPath free?",
      keywords: ["is it free", "is careerpath free", "cost money", "price pay charge", "how much cost", "is careerpath paid", "any charges"],
      answer: "Yes! CareerPath is free but some aspects may charge for students as courses enrollment or conversation with trainer."
    },
    {
      question: "How does it work?",
      keywords: ["how does it work", "how it works", "working process", "how to use careerpath", "how do i use this", "explain process"],
      answer: "Upload your resume or register manually. AI extracts and analyzes your skills. Rate your skills and take adaptive tests. Get personalized career matches and learning recommendations."
    },
    {
      question: "What if I don't have a resume?",
      keywords: ["no resume", "without resume", "dont have resume", "do not have resume", "no cv", "havent resume", "dont have cv", "if i dont have resume"],
      answer: "You can register directly on our platform. After registration, you can manually enter your skills and proceed with skill review, rating, and assessment. You can also access Learning Resources directly."
    },
    {
      question: "Do I need to create an account?",
      keywords: ["do i need account", "create account", "need account", "signup required", "login required", "must i register", "is account needed"],
      answer: "No! You can simply upload your resume and get started. We verify you using OTP sent to your email or phone. Registering is optional."
    },
    {
      question: "How do I upload my resume?",
      keywords: ["how do i upload", "how to upload resume", "upload resume", "submit resume", "resume upload", "where to upload"],
      answer: "Click 'Upload Resume' on the landing page. Select your PDF file (max 5MB). AI analyzes and extracts your skills. Proceed to skill review and rating."
    },
    {
      question: "What file formats are supported?",
      keywords: ["file format", "which format", "supported format", "what files", "which files supported", "pdf doc"],
      answer: "We support PDF format only. File size should be under 5MB."
    },
    {
      question: "What is skill review?",
      keywords: ["what is skill review", "skill review", "review skills", "confirm skills", "edit skills"],
      answer: "You see a list of skills extracted by AI. You can review, edit, delete, or add new skills. Then confirm the list is correct."
    },
    {
      question: "How does skill rating work?",
      keywords: ["how does skill rating", "skill rating work", "how to rate", "rating scale", "self rating", "how to rate skills", "how rating works"],
      answer: "Rate each skill from 1 to 10. 1 to 4 is Basic level. 5 to 7 is Intermediate level. 8 to 10 is Advanced level. This determines your adaptive test difficulty."
    },
    {
      question: "What are adaptive tests?",
      keywords: ["what are adaptive tests", "adaptive test", "what is adaptive", "about adaptive test", "adaptive testing"],
      answer: "Tests that match your skill level. Basic rating gives easy questions. Intermediate gives medium questions. Advanced gives challenging questions. Each test has 5 multiple-choice questions per skill."
    },
    {
      question: "Can I retake the assessment?",
      keywords: ["can i retake", "retake assessment", "take test again", "repeat test", "redo test", "retest", "retake test"],
      answer: "Yes! You can retake the skill assessment anytime to keep your recommendations up-to-date."
    },
    {
      question: "What happens after a test?",
      keywords: ["what happens after test", "what happens after a test", "after test", "after i submit test", "after exam"],
      answer: "You see your score immediately, can review each question with correct answers, and get recommendations based on your performance."
    },
    {
      question: "What happens after all tests?",
      keywords: ["after all tests", "what happens after all tests", "complete all tests", "finished tests", "after completing all"],
      answer: "You get a complete skill analysis report, personalized course recommendations, access to Learning Resources, career matches with scores, and can find trainers."
    },
    {
      question: "What is the dashboard?",
      keywords: ["what is dashboard", "what is the dashboard", "student dashboard", "about dashboard"],
      answer: "Your central hub to view progress, see available assessments, track completed tests, access Learning Resources, find trainers, and view skill analysis."
    },
    {
      question: "How accurate are career recommendations?",
      keywords: ["how accurate", "accurate recommendation", "are recommendations accurate", "reliable recommendation", "how reliable"],
      answer: "Our AI provides 85%+ accurate career recommendations based on your skills, experience, and interests. Accuracy improves with more data."
    },
    {
      question: "What career paths can I explore?",
      keywords: ["what career paths", "career paths can i explore", "what careers", "which career options", "career options"],
      answer: "Technology, Business, Creative, Healthcare, Education, and many more. You receive personalized matches based on your unique skill profile."
    },
    {
      question: "What are Learning Resources?",
      keywords: ["what are learning resources", "what is learning resources", "about learning resources", "learning resources meaning"],
      answer: "A learning resources page where you can explore content from trainers, access recommended courses, view videos and PDFs, get personalized recommendations, and find trainers."
    },
    {
      question: "Can I access Learning Resources without a resume?",
      keywords: ["access without resume", "without resume access", "skip upload", "no resume needed", "access learning resources without"],
      answer: "Yes! Just click the 'Learning Resources' button on the homepage. No resume needed."
    },
    {
      question: "How does course recommendation work?",
      keywords: ["how does course recommendation", "course recommendation work", "how course recommend", "how are courses recommended"],
      answer: "After tests, we identify your skill gaps and find best courses from platforms like Coursera, Udemy, and edX based on your test results and learning goals."
    },
    {
      question: "Can I download analysis results?",
      keywords: ["can i download", "download analysis", "download report", "download my report", "export report", "save report"],
      answer: "Yes! Download a complete PDF report with skill analysis, career matches, skill gaps, course recommendations, and learning roadmap."
    },
    {
      question: "What types of trainers are available?",
      keywords: ["what types of trainers", "types of trainers", "trainer types", "kinds of trainer", "categories of trainer", "what trainers"],
      answer: "Three types: Member Trainers are our in-house trainers. Regular Trainers do group sessions and video content. Personalized Trainers offer one-on-one coaching with custom plans."
    },
    {
      question: "How do I find trainers?",
      keywords: ["how do i find trainer", "how to find trainer", "find trainer", "search trainer", "where to find trainers"],
      answer: "Go to Learning Resources page, click 'Trainers' tab, search by name or specialty, view profiles, and click 'Connect' to start a conversation."
    },
    {
      question: "What is the difference between regular and personalized trainers?",
      keywords: ["difference between regular and personalized", "regular vs personalized", "difference regular personalized", "regular and personalized difference"],
      answer: "Regular: Group sessions, video content, multiple students. Personalized: One-on-one coaching, custom learning plans, individual progress tracking."
    },
    {
      question: "What are Member Trainers?",
      keywords: ["what are member trainers", "member trainer", "in house trainer", "our trainer", "member trainers"],
      answer: "Member Trainers are our in-house trainers who provide quality content and guidance. They are part of the CareerPath team."
    },
    {
      question: "What is Mock Interview?",
      keywords: ["what is mock interview", "mock interview", "about mock interview", "interview practice"],
      answer: "A practice tool where you select your target job role, get AI-generated interview questions, type your answers, receive feedback, and get improvement suggestions."
    },
    {
      question: "What is Expert Path?",
      keywords: ["what is expert path", "expert path", "about expert path"],
      answer: "For students scoring 90%+ in tests. Provides aptitude development, logical reasoning practice, communication courses, leadership programs, and soft skill resources."
    },
    {
      question: "How does AI analyze my resume?",
      keywords: ["how does ai analyze", "how ai analyze resume", "how resume analyze", "how is my resume analyzed", "how does analysis work"],
      answer: "AI extracts your name, contact info, technical and soft skills, work experience, education, certifications, and projects. Then matches with our career database."
    },
    {
      question: "Is my data safe?",
      keywords: ["is my data safe", "is data safe", "data secure", "privacy safe", "is my data secure"],
      answer: "Yes! Your data is encrypted, stored securely, never shared with third parties, and you can delete it anytime."
    },
    {
      question: "What is the Learning Roadmap?",
      keywords: ["what is learning roadmap", "what is the learning roadmap", "learning roadmap", "about roadmap", "what is roadmap"],
      answer: "A 4-phase plan. Phase 1: Foundation (Weeks 1-2). Phase 2: Intermediate (Weeks 3-4). Phase 3: Advanced (Weeks 5-8). Phase 4: Specialization (Weeks 9-12). Includes recommended courses and resources."
    },
    {
      question: "Can I become a trainer?",
      keywords: ["can i become trainer", "can i become a trainer", "become trainer", "how to become trainer", "join as trainer"],
      answer: "Yes! Register as a trainer, get admin approval, then create sessions, upload videos, and help students learn. Both regular and personalized training options available."
    },
    {
      question: "What is the student journey?",
      keywords: ["what is student journey", "student journey", "what is the journey", "full journey", "complete journey"],
      answer: "Resume Upload or Registration, Skill Review, Skill Rating, Adaptive Tests, Results Dashboard, Career Matching, Course Recommendations, Learning Resources, Find Trainers, Track Progress"
    },
    {
      question: "What is the difference between upload and register?",
      keywords: ["difference between upload and register", "upload vs register", "difference upload register", "upload or register"],
      answer: "Upload: You upload your resume and AI extracts your skills automatically. Register: You manually enter your details and skills without uploading a resume. Both lead to the same career guidance journey."
    },
    {
      question: "How long does the whole process take?",
      keywords: ["how long does the whole process", "how long is process", "how much time process", "process duration", "how long does it take"],
      answer: "The complete process from resume upload to getting recommendations takes about 10-15 minutes. You can also come back anytime to continue from where you left off."
    },
    {
      question: "Can I skip a test?",
      keywords: ["can i skip a test", "can i skip test", "skip test", "skip assessment", "can i skip assessment"],
      answer: "No, you cannot skip a test. You need to complete the test to get accurate career recommendations and course suggestions."
    },
    {
      question: "What happens if I fail a test?",
      keywords: ["what happens if i fail", "if i fail a test", "fail test", "failed test", "what if i fail"],
      answer: "There is no pass or fail. Your score determines your proficiency level and helps us recommend appropriate courses. Lower scores mean you'll get beginner-friendly course recommendations."
    },
    {
      question: "Can I change my skill rating after saving?",
      keywords: ["can i change my skill rating", "change skill rating", "change rating", "edit rating", "update rating"],
      answer: "Yes! You can go back and retake the skill assessment anytime. Your new ratings will update your recommendations."
    },
    {
      question: "What is OTP verification?",
      keywords: ["what is otp", "what is otp verification", "otp verification", "about otp"],
      answer: "OTP (One-Time Password) is a 6-digit code sent to your email or phone. You enter it to verify your identity without needing a password."
    },
    {
      question: "Can I use CareerPath on mobile?",
      keywords: ["can i use careerpath on mobile", "use on mobile", "careerpath on mobile", "work on mobile", "mobile app", "use on phone"],
      answer: "Yes! CareerPath is a web application that works on all mobile browsers. You can access it from your phone, tablet, or laptop."
    },
    {
      question: "Do I need technical skills to use CareerPath?",
      keywords: ["do i need technical skills", "need technical skills", "technical skills required", "need coding skills", "do i need coding"],
      answer: "No! CareerPath is designed for all students. You don't need any technical skills. Just upload your resume or register and follow the simple steps."
    },
    {
      question: "What if I don't know my skill level?",
      keywords: ["what if i dont know my skill", "dont know my skill", "not sure my skill", "confused about skill level", "dont know skill level"],
      answer: "That's okay! Just estimate your skill level honestly. You can always retake the assessment later. Our adaptive tests will help determine your actual level."
    },
    {
      question: "How do I enroll in a course?",
      keywords: ["how do i enroll in a course", "how to enroll in a course", "how do i enroll in course", "how to enroll in course", "how do i enroll", "how to enroll", "enroll in a course", "enroll in course", "join a course", "join course", "enrollment process"],
      answer: "Go to Learning Resources page, browse available courses from trainers, click 'Enroll' on any course you like, confirm enrollment, and you're in! The course will appear in your Student Dashboard under 'My Courses'."
    },
    {
      question: "What is the difference between content and courses?",
      keywords: ["difference between content and courses", "difference content courses", "content vs courses", "what is content and courses", "content and courses difference"],
      answer: "Content: Individual learning materials like videos, PDFs, notes, and slides that you can access freely. Courses: Structured learning programs with a trainer, schedule, enrollment, attendance tracking, progress tracking, and certificate upon completion."
    },
    {
      question: "Can I enroll in multiple courses?",
      keywords: ["can i enroll in multiple courses", "enroll in multiple courses", "multiple courses", "many courses", "enroll multiple"],
      answer: "Yes! You can enroll in as many courses as you want. Each course will appear separately in your 'My Courses' section with its own progress and attendance tracking."
    },
    {
      question: "Is there a limit to how many courses I can enroll in?",
      keywords: ["is there a limit to how many courses", "limit to how many courses", "limit courses", "maximum courses", "how many courses can i enroll"],
      answer: "No, there is no limit! You can enroll in as many courses as you want. However, we recommend focusing on 2-3 courses at a time for better learning."
    },
    {
      question: "Can I drop a course after enrolling?",
      keywords: ["can i drop a course", "drop a course", "drop course", "cancel enrollment", "leave course", "quit course"],
      answer: "Yes, you can drop a course. Go to 'My Courses' in your dashboard, select the course, and click 'Drop Course'. Your progress will be saved if you want to re-enroll later."
    },
    {
      question: "What happens if a course is full?",
      keywords: ["what happens if a course is full", "if a course is full", "course full", "no seats", "capacity full", "waitlist"],
      answer: "If a course is full, you'll be added to a waitlist. You'll be notified when a seat becomes available. We recommend enrolling early to secure your spot."
    },
    {
      question: "How do I see my enrolled courses?",
      keywords: ["how do i see my enrolled courses", "see my enrolled courses", "see my courses", "view my courses", "show my courses", "my enrolled courses"],
      answer: "Go to your Student Dashboard. Your enrolled courses appear in the 'My Courses' section with progress bars, attendance percentage, and a 'Continue Learning' button."
    },
    {
      question: "How do I track my progress in a course?",
      keywords: ["how do i track my progress", "track my progress in a course", "track progress", "course progress", "my course progress", "how to track progress"],
      answer: "Your progress is tracked automatically as you complete course content. You can see it in 'My Courses' on your dashboard. Progress starts at 0% and reaches 100% when you complete the course."
    },
    {
      question: "How is attendance tracked?",
      keywords: ["how is attendance tracked", "how is attendance track", "attendance tracked", "how attendance tracked", "how does attendance work", "attendance tracking", "how is attendance"],
      answer: "Trainers mark attendance daily for each session. You can view your attendance percentage on your dashboard. It shows Present, Absent, and Late status for each class."
    },
    {
      question: "What is my attendance percentage?",
      keywords: ["what is my attendance percentage", "my attendance percentage", "attendance percentage", "attendance score", "how much is my attendance"],
      answer: "Your attendance percentage is calculated as: (Present Days / Total Days) × 100. It's shown in your 'My Courses' section on the dashboard."
    },
    {
      question: "Can I see my daily attendance?",
      keywords: ["can i see my daily attendance", "see my daily attendance", "daily attendance", "attendance details", "attendance history", "attendance records"],
      answer: "Yes! Click 'View Attendance' on any enrolled course to see your complete attendance history with dates, status (Present/Absent/Late), and notes from the trainer."
    },
    {
      question: "What if I miss a class?",
      keywords: ["what if i miss a class", "if i miss a class", "miss class", "miss a class", "miss lecture", "cant attend class"],
      answer: "If you miss a class, it will be marked as 'Absent'. Try to maintain at least 75% attendance. Contact your trainer if you have a valid reason for absence."
    },
    {
      question: "Can I get a certificate after completing a course?",
      keywords: ["can i get a certificate", "get a certificate", "certificate after completing", "completion certificate", "course certificate", "do i get certificate"],
      answer: "Yes! Once you complete a course (100% progress), you'll receive a certificate of completion. You can download it from your dashboard."
    },
    {
      question: "What is the course duration?",
      keywords: ["what is the course duration", "course duration", "how long is course", "course time", "how long is a course"],
      answer: "Course duration varies. Some are 4 weeks, some are 8 weeks. You can see the duration in the course details when browsing courses. Each course has its own schedule."
    },
    {
      question: "Can I access course content after completion?",
      keywords: ["can i access course content after completion", "access course content after completion", "content after course", "access content after completion"],
      answer: "Yes! You can still access the course content after completing it. The content remains available in your Learning Resources. The course will show as 'Completed' in your dashboard."
    },
    {
      question: "How do I contact my trainer?",
      keywords: ["how do i contact my trainer", "contact my trainer", "contact trainer", "message trainer", "talk to trainer"],
      answer: "Go to Learning Resources, click on the trainer's profile, and click 'Connect'. You can also find their email and phone number in their profile for direct contact."
    },
    {
      question: "Can I switch trainers?",
      keywords: ["can i switch trainers", "switch trainers", "switch trainer", "change trainer", "different trainer"],
      answer: "Yes! If you're not satisfied with a trainer, you can drop the course and enroll in a different course with another trainer. We recommend reading trainer profiles before enrolling."
    },
    {
      question: "What if I have a problem with a course?",
      keywords: ["what if i have a problem with a course", "problem with a course", "problem course", "issue course", "complaint about course"],
      answer: "Contact our support team. Go to your dashboard, click 'Help', and describe your issue. We'll resolve it within 24-48 hours."
    },
    {
      question: "Can I get a refund if I don't like a course?",
      keywords: ["can i get a refund", "get a refund", "refund if i dont like", "refund course", "money back"],
      answer: "Refund policy depends on the course. Some courses offer a 7-day refund if you're not satisfied. Check the course details for the specific refund policy."
    },
    {
      question: "What is the cost of courses?",
      keywords: ["what is the cost of courses", "cost of courses", "course cost", "course price", "how much is course", "course fee"],
      answer: "Course costs vary. Some are free, some cost ₹499, ₹999, or more. You can see the price on each course card. Free courses are marked as 'Free'."
    },
    {
      question: "Are there any free courses?",
      keywords: ["are there any free courses", "any free courses", "are there free courses", "free courses available", "no cost course"],
      answer: "Yes! Many trainers offer free courses and content. Look for courses marked as 'Free' or content in the 'Content' tab which is always free to access."
    },
    {
      question: "What kind of content can I access?",
      keywords: ["what kind of content can i access", "what kind of content", "content types", "what content", "what content available"],
      answer: "You can access videos, PDFs, documents, notes, quizzes, assignments, and presentations. All content is created by approved trainers and categorized by skill and difficulty."
    },
    {
      question: "How do I watch a video?",
      keywords: ["how do i watch a video", "watch a video", "how to watch video", "watch video content"],
      answer: "Go to Learning Resources, click 'Content' tab, find a video you like, and click on it. The video will open in a new tab or player. You can watch it anytime."
    },
    {
      question: "How do I download a PDF?",
      keywords: ["how do i download a pdf", "download a pdf", "how to download pdf", "download pdf content"],
      answer: "Go to Learning Resources, click 'Content' tab, find a PDF you like, and click on it. It will open in a new tab where you can download or view it."
    },
    {
      question: "Is content free?",
      keywords: ["is content free", "content free", "is content free to access", "pay for content"],
      answer: "Yes! Most content on the platform is free. You can access videos, PDFs, notes, and slides without any payment. Some premium content may require enrollment in a course."
    },
    {
      question: "Can I share content with friends?",
      keywords: ["can i share content", "share content", "share content with friends", "send content to friend"],
      answer: "Yes! You can share the content URL with your friends. They can access free content without an account. For course content, they would need to enroll."
    },
    {
      question: "How do I become a trainer?",
      keywords: ["how do i become a trainer", "become a trainer", "how to become trainer", "trainer registration", "join as trainer"],
      answer: "Click 'Register as Trainer' on the homepage, fill in your details (name, email, phone, education, experience, specialty), submit, and wait for admin approval. Once approved, you can create content and courses."
    },
    {
      question: "What is the approval process for trainers?",
      keywords: ["what is the approval process for trainers", "approval process for trainers", "trainer approval", "when approved", "how long approval takes"],
      answer: "After registration, your profile is reviewed by our admin team. Approval usually takes 24-48 hours. You'll receive an email once approved. You can then log in and start creating content."
    },
    {
      question: "What are the different trainer categories?",
      keywords: ["what are the different trainer categories", "different trainer categories", "trainer categories", "types of trainers", "trainer roles"],
      answer: "Three categories: Member (in-house CareerPath trainers), Regular (group sessions and video content), and Personalized (one-on-one coaching with custom plans). Each has different responsibilities and benefits."
    },
    {
      question: "How do I create a course as a trainer?",
      keywords: ["how do i create a course", "create a course as trainer", "create course", "make course", "new course trainer"],
      answer: "Log in to your trainer dashboard, click 'Create Session', fill in the course details (title, description, date, time, duration, max students, price, level), and publish. Students can then enroll."
    },
    {
      question: "How do I upload content as a trainer?",
      keywords: ["how do i upload content as a trainer", "upload content as trainer", "upload content trainer", "add content trainer"],
      answer: "Go to your trainer dashboard, click 'Add Content', select content type (video, PDF, etc.), enter title, description, skill name, difficulty, upload the file or provide URL, and publish."
    },
    {
      question: "How do I mark attendance as a trainer?",
      keywords: ["how do i mark attendance", "mark attendance as trainer", "mark attendance trainer", "how to mark attendance"],
      answer: "Go to your trainer dashboard, select a session, view enrolled students, select Present/Absent/Late for each student, add notes if needed, and click 'Save'. Attendance is saved automatically."
    },
    {
      question: "Can I see my students' progress?",
      keywords: ["can i see my students progress", "see my students progress", "see student progress", "track student progress"],
      answer: "Yes! In your trainer dashboard, you can see all enrolled students, their progress percentage, attendance percentage, and today's attendance status. You can also view detailed progress reports."
    },
    {
      question: "How do I communicate with students?",
      keywords: ["how do i communicate with students", "communicate with students", "message students", "contact students"],
      answer: "You can message students through the platform. Go to your dashboard, select a student, and click 'Message'. You can also share your contact details in your profile for direct communication."
    },
    {
      question: "What is Personalized Coaching?",
      keywords: ["what is personalized coaching", "personalized coaching", "about personalized coaching", "one on one coaching"],
      answer: "Personalized Coaching is one-on-one training where you work directly with a student. You create custom learning plans, track individual progress, and provide personalized guidance. It's for students who need focused attention."
    },
    {
      question: "How do I set my availability?",
      keywords: ["how do i set my availability", "set my availability", "set availability", "available days trainer"],
      answer: "Go to your trainer settings, select available days (Monday-Sunday), set start and end times, and save. Students will see your availability when browsing your profile."
    },
    {
      question: "What skills can I be tested on?",
      keywords: ["what skills can i be tested on", "what skills tested", "which skills test", "skills tested"],
      answer: "You can be tested on any skill in your profile. Common skills include Python, Java, JavaScript, Data Science, Machine Learning, Web Development, SQL, and many more. Check your dashboard for available assessments."
    },
    {
      question: "How many questions are in each test?",
      keywords: ["how many questions are in each test", "how many questions in test", "how many questions", "test length", "number of questions"],
      answer: "Each test has 5 multiple-choice questions per skill. The difficulty level depends on your self-rating: Basic (1-4) gets easy questions, Intermediate (5-7) gets medium, Advanced (8-10) gets hard."
    },
    {
      question: "How long do I have to complete a test?",
      keywords: ["how long do i have to complete a test", "how long to complete test", "test time", "time limit test", "how long test"],
      answer: "There is no strict time limit for tests. Take your time to read each question carefully and select the best answer. You can review your answers before submitting."
    },
    {
      question: "Can I review my answers before submitting?",
      keywords: ["can i review my answers", "review my answers", "review answers", "check answers before submit"],
      answer: "Yes! You can review all your answers before submitting the test. Once submitted, you cannot change your answers. Take your time to double-check."
    },
    {
      question: "What happens after I submit a test?",
      keywords: ["what happens after i submit a test", "after i submit a test", "after submit", "after submitting test"],
      answer: "You'll see your score immediately. You can review each question with the correct answer and explanation. Based on your performance, you'll get personalized course and content recommendations."
    },
    {
      question: "Can I see the correct answers?",
      keywords: ["can i see the correct answers", "see the correct answers", "correct answers", "right answers", "see answers"],
      answer: "Yes! After submitting the test, you can review each question and see the correct answer along with a detailed explanation. This helps you learn from your mistakes."
    },
    {
      question: "What is a good score?",
      keywords: ["what is a good score", "good score", "passing score", "what score"],
      answer: "There is no passing or failing score. Your score helps us understand your proficiency level. 80%+ means you're Advanced, 50-79% means Intermediate, below 50% means Beginner. We recommend courses accordingly."
    },
    {
      question: "Can I take a test multiple times?",
      keywords: ["can i take a test multiple times", "take a test multiple times", "take test multiple", "test multiple times", "retake test"],
      answer: "Yes! You can retake any test as many times as you want. Your latest score will be used for recommendations. Retaking tests helps you track your improvement over time."
    },
    {
      question: "What are concept tests?",
      keywords: ["what are concept tests", "concept tests", "concept test", "concept assessment"],
      answer: "Concept tests assess your understanding of core concepts in a skill. They are separate from skill tests and help identify gaps in your foundational knowledge. You can take them after skill tests."
    },
    {
      question: "How do tests help me?",
      keywords: ["how do tests help me", "how do tests help", "how tests help", "benefits of tests", "why tests"],
      answer: "Tests help us understand your actual skill level, identify your strengths and weaknesses, and recommend the most suitable courses and content for you. They ensure you get the right learning path."
    },
    {
      question: "What can I see on my dashboard?",
      keywords: ["what can i see on my dashboard", "what can i see dashboard", "dashboard content", "what is on dashboard"],
      answer: "Your dashboard shows: Welcome message, My Courses (enrolled courses with progress and attendance), Your Progress (overall career journey), Available Assessments (skills to test), Quick action buttons, and Referral program."
    },
    {
      question: "How do I continue where I left off?",
      keywords: ["how do i continue where i left off", "continue where i left off", "continue where left", "pick up where"],
      answer: "Click 'Continue Where You Left Off' on your dashboard. It will take you to the exact step you were on - whether that's skill review, skill rating, or assessment."
    },
    {
      question: "What is the progress bar on my dashboard?",
      keywords: ["what is the progress bar", "progress bar on my dashboard", "progress bar", "dashboard progress"],
      answer: "The progress bar shows your overall career journey: Resume Upload → Skill Review → Skill Rating → Assessment. It visually shows which steps you've completed and which are pending."
    },
    {
      question: "Can I start a new resume analysis?",
      keywords: ["can i start a new resume analysis", "start a new resume analysis", "start new resume", "new resume analysis"],
      answer: "Yes! Click 'Start New Resume' on your dashboard. You can upload a new resume, and the AI will analyze it, extract new skills, and start a fresh career journey."
    },
    {
      question: "How do I view my skill analysis?",
      keywords: ["how do i view my skill analysis", "view my skill analysis", "skill analysis", "view analysis"],
      answer: "Go to your dashboard. Your skill analysis is shown in the progress section and assessment section. You can see skill names, ratings, and proficiency levels."
    },
    {
      question: "Can I download my analysis report?",
      keywords: ["can i download my analysis report", "download my analysis report", "download my report", "get my report"],
      answer: "Yes! After completing assessments, you can download a complete PDF report. It includes skill analysis, career matches, skill gaps, course recommendations, and learning roadmap."
    },
    {
      question: "How does career matching work?",
      keywords: ["how does career matching work", "career matching work", "how career matching", "how matching works"],
      answer: "Our AI matches your skills, experience, and interests with our database of career paths. It calculates a match score for each career and shows you the best options with detailed insights."
    },
    {
      question: "What is a match score?",
      keywords: ["what is a match score", "match score", "match percentage", "what is match score"],
      answer: "Match score is a percentage (0-100%) that shows how well your skills and profile match a particular career or course. 90%+ means excellent match, 70-89% means good match, below 70% means partial match."
    },
    {
      question: "Can I see job recommendations?",
      keywords: ["can i see job recommendations", "see job recommendations", "job recommendations", "job suggestions"],
      answer: "Yes! Based on your skills and career matches, we provide job role recommendations. You can see them in your dashboard and download the complete report."
    },
    {
      question: "How do I choose a career path?",
      keywords: ["how do i choose a career path", "choose a career path", "choose career", "which career to choose"],
      answer: "Upload your resume, rate your skills, take assessments, and review your career matches. The platform shows you the best-fit careers based on your unique profile. You can also explore different paths."
    },
    {
      question: "Can I change my career path later?",
      keywords: ["can i change my career path", "change my career path", "change career", "switch career"],
      answer: "Yes! You can re-upload your resume, update your skills, retake assessments, and get new career recommendations. The platform adapts to your evolving profile."
    },
    {
      question: "What if the website is not working?",
      keywords: ["what if the website is not working", "website not working", "site not working", "website down"],
      answer: "Try refreshing the page, clearing your browser cache, or using a different browser. If the issue persists, contact our support team through the Help section on your dashboard."
    },
    {
      question: "I forgot my password. What do I do?",
      keywords: ["i forgot my password", "forgot my password", "forgot password", "reset password", "lost password"],
      answer: "Click 'Forgot Password' on the login page. Enter your registered email or phone number, and we'll send you an OTP to reset your password."
    },
    {
      question: "How do I update my profile?",
      keywords: ["how do i update my profile", "update my profile", "update profile", "edit profile"],
      answer: "Go to your dashboard, click on your profile icon, and select 'Edit Profile'. You can update your name, email, phone, and other details. Click 'Save' to apply changes."
    },
    {
      question: "Can I delete my account?",
      keywords: ["can i delete my account", "delete my account", "delete account", "remove account"],
      answer: "Yes! Go to your profile settings and click 'Delete Account'. Your data will be permanently deleted from our servers. This action cannot be undone."
    },
    {
      question: "How do I contact support?",
      keywords: ["how do i contact support", "contact support", "customer service", "how to contact support"],
      answer: "Go to your dashboard, click 'Help' or 'Support'. You can submit a support ticket, and our team will respond within 24-48 hours. You can also email us at support@careerpath.com."
    },
    {
      question: "What is the Refer & Earn program?",
      keywords: ["what is the refer earn program", "refer and earn", "refer earn", "referral program"],
      answer: "Invite your friends to CareerPath using your unique referral code. When they join, you earn rewards. You can track your referrals and earnings in your dashboard."
    },
    {
      question: "How do I get my referral code?",
      keywords: ["how do i get my referral code", "get my referral code", "referral code", "my referral"],
      answer: "Go to your dashboard, click 'Refer & Earn', and you'll see your unique referral code. Share it with friends via WhatsApp, email, or social media."
    },
    {
      question: "How much can I earn from referrals?",
      keywords: ["how much can i earn from referrals", "earn from referrals", "referral earnings", "how much refer"],
      answer: "You earn rewards for each successful referral. The exact amount depends on the program. Check your dashboard for current referral rewards and terms."
    },
    {
      question: "How does Mock Interview work?",
      keywords: ["how does mock interview work", "mock interview work", "how mock interview"],
      answer: "Select your target job role, get AI-generated interview questions, type your answers, receive instant feedback, and get improvement suggestions. It's like a real interview but with AI."
    },
    {
      question: "What job roles can I practice for?",
      keywords: ["what job roles can i practice for", "what job roles practice", "job roles interview", "practice roles"],
      answer: "You can practice for any job role in our database, including Software Engineer, Data Scientist, Web Developer, Product Manager, Business Analyst, and many more."
    },
    {
      question: "Is Mock Interview free?",
      keywords: ["is mock interview free", "mock interview free", "mock interview cost"],
      answer: "Yes! Mock Interview is completely free. You can practice as many times as you want with different job roles and questions."
    },
    {
      question: "Can I see my interview performance?",
      keywords: ["can i see my interview performance", "see my interview performance", "interview performance", "interview results"],
      answer: "Yes! After each mock interview, you'll receive detailed feedback on your answers, including strengths, weaknesses, and suggestions for improvement. You can also review your past interviews."
    },
    {
      question: "How do I qualify for Expert Path?",
      keywords: ["how do i qualify for expert path", "qualify for expert path", "qualify expert", "expert path eligibility"],
      answer: "Score 90% or above in your skill assessments. Once you achieve this, Expert Path automatically unlocks in your dashboard with advanced resources and courses."
    },
    {
      question: "What resources are in Expert Path?",
      keywords: ["what resources are in expert path", "resources in expert path", "expert resources", "expert path content"],
      answer: "Expert Path includes: Aptitude development modules, Logical reasoning practice, Communication courses, Leadership programs, Soft skill resources, and Advanced career guidance."
    }
  ]

  const suggestions = [
    "What is CareerPath?",
    "How does it work?",
    "What if I don't have a resume?",
    "Is it free?",
    "How do I enroll in a course?",
    "Can I get a certificate?",
    "How do I find trainers?",
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
          setChatHeight(`${viewport.height}px`)
        } else {
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

    const handleResize = () => {
      if (!window.visualViewport) {
        const isMobile = window.innerWidth < 640
        if (isMobile) {
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

  const handleInputFocus = () => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 300)
  }

  const fetchTrainers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/trainers`)
      const trainers = response.data || []
      const approvedTrainers = trainers.filter(t => t.is_approved === true)
      
      if (approvedTrainers.length === 0) {
        return "There are currently no approved trainers on the platform. Trainers are being reviewed. Please check back later!"
      }
      
      let message = `We currently have ${approvedTrainers.length} approved trainer${approvedTrainers.length > 1 ? 's' : ''}:\n\n`
      
      approvedTrainers.slice(0, 10).forEach((trainer, index) => {
        const category = trainer.category ? trainer.category.charAt(0).toUpperCase() + trainer.category.slice(1) : 'Regular'
        const specialty = trainer.specialty || 'General'
        message += `${index + 1}. ${trainer.name || 'Unknown'}\n   Category: ${category}\n   Specialty: ${specialty}\n\n`
      })
      
      if (approvedTrainers.length > 10) {
        message += `...and ${approvedTrainers.length - 10} more trainers.\n\n`
      }
      
      message += `You can view all trainers in the Learning Resources page under the 'Trainers' tab.`
      
      return message
    } catch (error) {
      console.error('Error fetching trainers:', error)
      return "I'm having trouble fetching the trainer list right now. Please try again in a moment, or check the Learning Resources page directly."
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/trainers`)
      const trainers = response.data || []
      const approvedTrainers = trainers.filter(t => t.is_approved === true)
      
      let allSessions = []
      approvedTrainers.forEach(trainer => {
        if (trainer.sessions && trainer.sessions.length > 0) {
          trainer.sessions.forEach(session => {
            allSessions.push({
              ...session,
              trainer_name: trainer.name
            })
          })
        }
      })
      
      if (allSessions.length === 0) {
        return "There are currently no courses available. Trainers are creating new courses. Please check back later!"
      }
      
      let message = `We currently have ${allSessions.length} course${allSessions.length > 1 ? 's' : ''} available:\n\n`
      
      allSessions.slice(0, 8).forEach((course, index) => {
        const price = course.price > 0 ? `₹${course.price}` : 'Free'
        message += `${index + 1}. ${course.title || 'Untitled'}\n   Trainer: ${course.trainer_name}\n   Level: ${course.level || 'Beginner'}\n   Price: ${price}\n\n`
      })
      
      if (allSessions.length > 8) {
        message += `...and ${allSessions.length - 8} more courses.\n\n`
      }
      
      message += `Visit the Learning Resources page to browse and enroll in courses.`
      
      return message
    } catch (error) {
      console.error('Error fetching courses:', error)
      return "I'm having trouble fetching the course list right now. Please try again in a moment."
    }
  }

  const fetchMyEnrollments = async () => {
    try {
      const storedUser = sessionStorage.getItem('careerUser')
      if (!storedUser) {
        return "Please login first to see your enrolled courses."
      }
      
      const user = JSON.parse(storedUser)
      if (!user.resumeId) {
        return "Please login first to see your enrolled courses."
      }
      
      const response = await axios.get(`${API_BASE_URL}/enrollments/${user.resumeId}`)
      const enrollments = response.data || []
      
      if (enrollments.length === 0) {
        return "You haven't enrolled in any courses yet. Visit the Learning Resources page to browse and enroll in courses!"
      }
      
      let message = `You are enrolled in ${enrollments.length} course${enrollments.length > 1 ? 's' : ''}:\n\n`
      
      enrollments.forEach((enrollment, index) => {
        message += `${index + 1}. ${enrollment.session_title}\n   Trainer: ${enrollment.trainer_name}\n   Progress: ${enrollment.progress}%\n   Attendance: ${enrollment.attendance_percentage}%\n   Status: ${enrollment.status}\n\n`
      })
      
      message += `View full details on your Student Dashboard.`
      
      return message
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      return "I'm having trouble fetching your enrollments right now. Please check your Student Dashboard directly."
    }
  }

  const fetchMyTestResults = async () => {
    try {
      const storedUser = sessionStorage.getItem('careerUser')
      if (!storedUser) {
        return "Please login first to see your test results."
      }
      
      const user = JSON.parse(storedUser)
      if (!user.resumeId) {
        return "Please login first to see your test results."
      }
      
      const response = await axios.get(`${API_BASE_URL}/test/all-results/${user.resumeId}`)
      const results = response.data || []
      
      if (results.length === 0) {
        return "You haven't completed any tests yet. Go to your dashboard to start your assessments!"
      }
      
      let message = `You have completed ${results.length} test${results.length > 1 ? 's' : ''}:\n\n`
      
      results.forEach((result, index) => {
        const score = result.score_percentage || 0
        let level = 'Beginner'
        if (score >= 80) level = 'Advanced'
        else if (score >= 50) level = 'Intermediate'
        
        message += `${index + 1}. ${result.skill_name}\n   Score: ${score}%\n   Level: ${level}\n   Status: ${result.result_status || 'Completed'}\n\n`
      })
      
      message += `View detailed results on your Student Dashboard.`
      
      return message
    } catch (error) {
      console.error('Error fetching test results:', error)
      return "I'm having trouble fetching your test results right now. Please check your Student Dashboard directly."
    }
  }

  const fetchMyProgress = async () => {
    try {
      const storedUser = sessionStorage.getItem('careerUser')
      if (!storedUser) {
        return "Please login first to see your progress."
      }
      
      const user = JSON.parse(storedUser)
      if (!user.resumeId) {
        return "Please login first to see your progress."
      }
      
      const response = await axios.get(`${API_BASE_URL}/user/progress/${user.resumeId}`)
      const progress = response.data
      
      let message = `Here's your career progress, ${progress.name || 'Student'}:\n\n`
      message += `Current Step: ${progress.current_step || 'Review'}\n`
      message += `Skills: ${progress.rated_skills || 0}/${progress.total_skills || 0} rated\n`
      message += `Concepts: ${progress.rated_concepts || 0}/${progress.total_concepts || 0} rated\n\n`
      
      if (progress.skills_rated) {
        message += `✅ Skills Rated\n`
      } else {
        message += `⏳ Skills Rating Pending\n`
      }
      
      if (progress.test_completed) {
        message += `✅ Assessment Completed\n`
      } else {
        message += `⏳ Assessment Pending\n`
      }
      
      message += `\nContinue your journey on the Student Dashboard!`
      
      return message
    } catch (error) {
      console.error('Error fetching progress:', error)
      return "I'm having trouble fetching your progress right now. Please check your Student Dashboard directly."
    }
  }

  const fetchContentCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/trainers`)
      const trainers = response.data || []
      const approvedTrainers = trainers.filter(t => t.is_approved === true)
      
      let totalContent = 0
      let contentByType = {}
      
      for (const trainer of approvedTrainers) {
        try {
          const contentRes = await axios.get(`${API_BASE_URL}/member/contents/${trainer.id}`)
          const contents = contentRes.data || []
          totalContent += contents.length
          contents.forEach(c => {
            const type = c.content_type || 'other'
            contentByType[type] = (contentByType[type] || 0) + 1
          })
        } catch (e) {
        }
      }
      
      if (totalContent === 0) {
        return "There is currently no content available. Trainers are uploading new content regularly. Please check back later!"
      }
      
      let message = `We currently have ${totalContent} learning resources available:\n\n`
      
      Object.entries(contentByType).forEach(([type, count]) => {
        const label = type.charAt(0).toUpperCase() + type.slice(1)
        message += `• ${label}s: ${count}\n`
      })
      
      message += `\nVisit the Learning Resources page to access all content!`
      
      return message
    } catch (error) {
      console.error('Error fetching content:', error)
      return "I'm having trouble fetching the content list right now. Please check the Learning Resources page directly."
    }
  }

  const getResponse = async (userInput) => {
    const input = userInput.toLowerCase().trim()

    const hasMeaningfulWords = /[a-zA-Z]{3,}/.test(input)
    const isGibberish = !hasMeaningfulWords || input.length < 2

    if (input.match(/^(hi|hello|hey|good morning|good afternoon|good evening|hii|heyy|hlo)/)) {
      return "Hello! How may I help you today?"
    }

    if (input.match(/^(thanks|thank you|thankyou|thx|tysm|thank u|thank|thnx)/)) {
      const responses = [
        "You're welcome! 😊 Is there anything else I can help with?",
        "Happy to help! 😊 What else would you like to know?",
        "My pleasure! 😊 Feel free to ask anything else.",
        "Always here to help! 😊 Got more questions?"
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }

    if (input.match(/^(yes|yeah|sure|ok|okay|yep|yea|yup)/)) {
      return "Great! What would you like to know about CareerPath?"
    }

    if (input.match(/^(no|nope|not|nah|na)/)) {
      return "Alright! Let me know if you have any other questions. 😊"
    }

    if (input.match(/^(bye|goodbye|see you|farewell|tata|bbye)/)) {
      return "Goodbye! Have a great day! Come back anytime. 👋"
    }

    if (input.match(/^(help|what can you do|capabilities|what do you do)/)) {
      return "I can help with: \n• Resume Upload & Analysis \n• Registration (no resume) \n• Skill Review & Rating \n• Adaptive Testing \n• Career Matching \n• Learning Resources \n• Course Enrollment \n• Attendance Tracking \n• Finding Trainers \n• Mock Interview \n• Expert Path \n• Learning Roadmap"
    }

    if (isGibberish) {
      return "I'm not sure I understand that. Could you please ask a clear question about CareerPath? 😊 Try asking something like:\n• What is CareerPath?\n• How do I enroll in a course?\n• How is attendance tracked?"
    }

    // REAL-TIME QUERIES - Trainers list
    if (input.match(/(who|list|show|all|how many|which|registered|available).*(trainer|trainers|teacher|teachers|instructor|instructors)/) ||
        input.match(/(trainer|trainers|teacher|teachers).*(registered|available|list|all|count|how many)/)) {
      return await fetchTrainers()
    }

    // REAL-TIME QUERIES - Courses list
    if (input.match(/(who|list|show|all|how many|which|available).*(course|courses|session|sessions|class|classes)/) ||
        input.match(/(course|courses|session|sessions).*(available|list|all|count|how many)/)) {
      return await fetchCourses()
    }

    // REAL-TIME QUERIES - My Enrollments
    if (input.match(/(my|mine|enrolled|enrollment|enrollments).*(course|courses)/) ||
        input.match(/(course|courses).*(enrolled|my|mine|joined)/) ||
        input.match(/(which|what|show|list).*(course|courses).*(enrolled|joined|taken)/)) {
      return await fetchMyEnrollments()
    }

    // REAL-TIME QUERIES - My Test Results
    if (input.match(/(my|mine|show|list|what).*(test|tests|result|results|score|scores|assessment|assessments)/) ||
        input.match(/(test|tests|result|results|score|scores).*(my|mine|got|received)/)) {
      return await fetchMyTestResults()
    }

    // REAL-TIME QUERIES - My Progress
    if (input.match(/(my|mine|show|what|how).*(progress|status|journey)/) ||
        input.match(/(progress|status).*(my|mine|current)/)) {
      return await fetchMyProgress()
    }

    // REAL-TIME QUERIES - Content count
    if (input.match(/(how many|count|total|number of).*(content|contents|video|videos|pdf|pdfs|resource|resources|material|materials)/) ||
        input.match(/(content|contents|video|videos|pdf|pdfs|resource|resources).*(available|count|total|how many)/)) {
      return await fetchContentCount()
    }

    let bestMatch = null
    let highestScore = 0

    for (const faq of faqs) {
      let score = 0
      for (const keyword of faq.keywords) {
        if (input.includes(keyword)) {
          // Longer keywords get higher scores (more specific match)
          score += keyword.length
        }
      }
      if (score > highestScore) {
        highestScore = score
        bestMatch = faq
      }
    }

    // Require a minimum score of 8 (meaning at least one meaningful keyword matched)
    // This prevents short keyword matches like "how" from triggering wrong answers
    if (bestMatch && highestScore >= 8) {
      return bestMatch.answer
    }

    // ===== SMART FALLBACK FOR UNKNOWN QUESTIONS =====
    return `I'm not sure about that specific question, but I'd love to help! 🤔

Here are some things I can help you with:

📄 **Getting Started**
• What is CareerPath?
• How does it work?
• What if I don't have a resume?

📝 **Tests & Skills**
• How does skill rating work?
• What are adaptive tests?
• Can I retake the assessment?

🎓 **Courses & Learning**
• How do I enroll in a course?
• What is the difference between content and courses?
• How is attendance tracked?
• Can I get a certificate?

👨‍🏫 **Trainers**
• How do I find trainers?
• What types of trainers are available?

💼 **Career**
• How does career matching work?
• What is the Learning Roadmap?

You can also ask real-time questions like:
• Who are the trainers?
• What courses are available?
• Show my enrolled courses
• What are my test results?

Please try rephrasing your question, or pick one from the list above! 😊`
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

    setTimeout(async () => {
      const response = await getResponse(input.trim())
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
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
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

          {showSuggestions && messages.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 6).map((text, index) => (
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