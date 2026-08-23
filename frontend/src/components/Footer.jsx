import React from 'react'

function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                AI
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                CareerAI
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Helping students discover their perfect career path with AI-powered guidance
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><a href="#features" className="hover:text-blue-400 transition">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-blue-400 transition">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-lg">Contact</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="hover:text-white transition">support@careerpath.com</li>
              <li className="hover:text-white transition">+1 (555) 123-4567</li>
              <li className="hover:text-white transition">123 AI Street, Silicon Valley</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 text-lg">Follow Us</h4>
            <div className="flex flex-col space-y-3">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">Twitter</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-sm">
          © 2026 CareerPath. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer