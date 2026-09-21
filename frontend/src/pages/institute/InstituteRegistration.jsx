import React, { useState } from 'react'
import API_BASE_URL from '../../config'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'

function InstituteRegistration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    // Account
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Institute
    institute_name: '',
    institute_type: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    website: '',
    description: '',
    // Contact
    contact_person_name: '',
    contact_person_designation: '',
    contact_person_phone: '',
    // Business
    registration_number: '',
    gst_number: '',
    pan_number: '',
    partnership_type: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!formData.institute_type) {
      setError('Please select an institute type')
      return
    }

    if (!formData.partnership_type) {
      setError('Please select a partnership type')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await axios.post(`${API_BASE_URL}/institute/register`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        institute_name: formData.institute_name,
        institute_type: formData.institute_type,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        website: formData.website,
        description: formData.description,
        contact_person_name: formData.contact_person_name,
        contact_person_designation: formData.contact_person_designation,
        contact_person_phone: formData.contact_person_phone,
        registration_number: formData.registration_number,
        gst_number: formData.gst_number,
        pan_number: formData.pan_number,
        partnership_type: formData.partnership_type
      })

      console.log('Registration response:', response.data)
      setSuccess(true)
      setLoading(false)

      setFormData({
        name: '', email: '', phone: '', password: '', confirmPassword: '',
        institute_name: '', institute_type: '', address: '', city: '', state: '',
        pincode: '', website: '', description: '', contact_person_name: '',
        contact_person_designation: '', contact_person_phone: '',
        registration_number: '', gst_number: '', pan_number: '', partnership_type: ''
      })

      setTimeout(() => navigate('/login/institute'), 3000)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const handleLoginRedirect = () => {
    navigate('/login/institute')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <div className="max-w-3xl mx-auto pt-24 pb-12 px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition mb-4"
        >
          <span className="text-xl">←</span>
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
              Institute Registration
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-4">
              Join as Institute / Partner
            </h1>
            <p className="text-gray-600 mt-2">
              Register your training institute to start offering courses.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-4 text-sm">
              ✅ Registration successful! Please wait for admin approval.
              <br />
              <span className="text-sm text-green-500">You can now login after admin approval.</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ============== ACCOUNT DETAILS ============== */}
            <h2 className="text-lg font-bold text-gray-800 mb-3 mt-2">Account Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Type *</label>
                <select
                  name="institute_type" value={formData.institute_type} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Institute Type</option>
                  <option value="training">Training Institute</option>
                  <option value="partner">Partner</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password" name="password" value={formData.password} onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* ============== INSTITUTE DETAILS ============== */}
            <h2 className="text-lg font-bold text-gray-800 mb-3 mt-8 border-t border-gray-100 pt-6">Institute Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Name *</label>
                <input
                  type="text" name="institute_name" value={formData.institute_name} onChange={handleChange}
                  placeholder="Enter institute name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address" value={formData.address} onChange={handleChange} rows="2"
                  placeholder="Enter full address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text" name="city" value={formData.city} onChange={handleChange}
                  placeholder="Enter city"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text" name="state" value={formData.state} onChange={handleChange}
                  placeholder="Enter state"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text" name="pincode" value={formData.pincode} onChange={handleChange}
                  placeholder="Enter pincode"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url" name="website" value={formData.website} onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description" value={formData.description} onChange={handleChange} rows="2"
                  placeholder="Describe your institute"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* ============== CONTACT & BUSINESS ============== */}
            <h2 className="text-lg font-bold text-gray-800 mb-3 mt-8 border-t border-gray-100 pt-6">Contact & Business Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Name</label>
                <input
                  type="text" name="contact_person_name" value={formData.contact_person_name} onChange={handleChange}
                  placeholder="Enter contact person name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  type="text" name="contact_person_designation" value={formData.contact_person_designation} onChange={handleChange}
                  placeholder="Enter designation"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Phone</label>
                <input
                  type="tel" name="contact_person_phone" value={formData.contact_person_phone} onChange={handleChange}
                  placeholder="Enter contact phone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partnership Type *</label>
                <select
                  name="partnership_type" value={formData.partnership_type} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Partnership Type</option>
                  <option value="referral">Referral Partner</option>
                  <option value="franchise">Franchise Partner</option>
                  <option value="affiliate">Affiliate Partner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text" name="registration_number" value={formData.registration_number} onChange={handleChange}
                  placeholder="Enter registration number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input
                  type="text" name="gst_number" value={formData.gst_number} onChange={handleChange}
                  placeholder="Enter GST number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <input
                  type="text" name="pan_number" value={formData.pan_number} onChange={handleChange}
                  placeholder="Enter PAN number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mt-6 text-sm">
              <strong>Note:</strong> Your registration will be reviewed by our admin team.
              You will be able to login once approved.
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition font-bold disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button
                onClick={handleLoginRedirect}
                className="text-blue-600 hover:text-blue-800 font-medium transition"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstituteRegistration