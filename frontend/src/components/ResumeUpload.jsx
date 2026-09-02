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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    noDrag: true,
    noDragEventsBubbling: true
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
      {/* Simple Browse Button */}
      <div {...getRootProps()} className="cursor-pointer">
        <input {...getInputProps()} />
        <button 
          type="button"
          className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-10 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition hover:scale-105"
        >
          Browse Resume
        </button>
        <p className="text-sm text-gray-500 mt-2">PDF, DOC (Max 5MB)</p>
      </div>

      {/* File Preview */}
      {file && (
        <div className="mt-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center text-2xl shadow-md">
                📄
              </div>
              <div>
                <p className="font-semibold text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={removeFile} 
              className="w-10 h-10 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition flex items-center justify-center text-xl"
            >
              ✕
            </button>
          </div>

          {success && (
            <div className="mt-4 text-green-600 bg-green-50 p-3 rounded-xl text-sm font-medium">
              ✅ Resume uploaded successfully!
            </div>
          )}

          {error && (
            <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-xl text-sm font-medium">
              ❌ {error}
            </div>
          )}

          {!uploading && !success && (
            <button 
              onClick={handleUpload} 
              className="mt-4 w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-3 rounded-xl hover:shadow-lg transition font-semibold"
            >
              Upload Resume
            </button>
          )}

          {uploading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#667eea]"></div>
              <p className="text-gray-500 mt-1 text-sm">Uploading...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResumeUpload