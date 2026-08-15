import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadResume } from '../utils/api'

function ResumeUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setFile(selectedFile)
      setError(null)
      setSuccess(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  })

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await uploadResume(file)
      setSuccess(true)
      setUploading(false)
      if (onUploadSuccess) {
        onUploadSuccess(response)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div
        {...getRootProps()}
        className={`relative border-3 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-500 overflow-hidden ${
          isDragActive 
            ? 'border-[#667eea] bg-gradient-to-br from-[#f0f4ff] to-[#e8eeff] scale-105 shadow-2xl' 
            : 'border-gray-300 hover:border-[#667eea] hover:bg-gradient-to-br hover:from-[#f8faff] hover:to-[#f0f4ff]'
        }`}
      >
        <input {...getInputProps()} />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-[#f093fb] to-[#f5576c] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="relative z-10">
          <div className="inline-block p-6 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-3xl shadow-2xl mb-6">
            <span className="text-6xl">📄</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-4">
            {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
          </p>
          <p className="text-gray-500 mt-2">or click to browse files</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">PDF</span>
            <span className="bg-gradient-to-r from-[#43e97b] to-[#38f9d7] text-gray-800 text-xs font-bold px-4 py-2 rounded-full shadow-md">Max 5MB</span>
            <span className="bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">Free</span>
          </div>
        </div>
      </div>

      {file && (
        <div className="mt-8 p-6 bg-white rounded-3xl shadow-2xl border border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center text-3xl shadow-xl">📄</div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button onClick={removeFile} className="w-12 h-12 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-all duration-300 flex items-center justify-center text-xl hover:scale-110">✕</button>
          </div>

          {success && (
            <div className="mt-6 flex items-center text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-2xl mr-4 shadow-lg">✅</div>
              <div>
                <p className="font-bold text-gray-800">Resume uploaded successfully!</p>
                <p className="text-sm text-gray-500">File saved in database</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-center text-red-600 bg-gradient-to-r from-red-50 to-pink-50 p-5 rounded-2xl border border-red-100">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-2xl mr-4 shadow-lg">❌</div>
              <div>
                <p className="font-bold text-gray-800">Upload Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!uploading && !success && (
            <button onClick={handleUpload} className="mt-6 w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-4 rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold text-lg hover:scale-[1.02]">
              📤 Upload Resume
            </button>
          )}

          {uploading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea]"></div>
              <p className="text-gray-500 mt-2">Uploading...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResumeUpload