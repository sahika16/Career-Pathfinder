import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'
import API_BASE_URL from '../../config'

const COMPANY_TYPES = [
  'Private limited company', 'Public limited company', 'LLP', 'Partnership',
  'Proprietorship', 'Startup', 'MNC', 'Government / PSU', 'NGO / Non-profit', 'Other'
]

const INDUSTRIES = [
  'IT / Software', 'Data Science / AI', 'Cloud / DevOps', 'Cybersecurity',
  'Finance / Banking', 'Healthcare', 'E-commerce', 'EdTech', 'Manufacturing',
  'Consulting', 'Digital Marketing', 'Telecom', 'Logistics', 'Other'
]

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']

const DESIGNATIONS = [
  'HR Manager', 'HR Executive', 'Talent Acquisition Specialist', 'Technical Recruiter',
  'Founder / Co-founder', 'Director', 'Team Lead', 'Engineering Manager', 'Other'
]

const CONTACT_METHODS = ['Email', 'Phone', 'Platform']

const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com']

const STEPS = [
  { key: 'company', label: 'Company Profile' },
  { key: 'location', label: 'Company Location' },
  { key: 'recruiter', label: 'Recruiter & Account' },
  { key: 'verification', label: 'Verification & Submit' }
]

function RecruiterRegistration() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    // Company
    company_name: '',
    company_type: '',
    industry: [],
    company_website: '',
    company_size: '',
    company_logo_url: '',
    company_description: '',

    // Location
    country: 'India',
    state: '',
    city: '',
    complete_address: '',
    pincode: '',

    // Recruiter
    name: '',
    designation: '',
    official_email: '',
    mobile_number: '',
    linkedin_url: '',
    preferred_contact_method: '',
    password: '',
    confirmPassword: '',

    // Verification
    legal_business_name: '',
    gst_number: '',
    cin_number: '',
    business_registration_url: '',
    company_domain_proof_url: '',

    // Declarations
    accept_terms: false,
    accept_privacy: false,
    declare_accuracy: false,
    consent_candidate_data: false,
    accept_hiring_ethics: false
  })

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }))

  const toggleIndustry = (value) => {
    setForm((p) => ({
      ...p,
      industry: p.industry.includes(value)
        ? p.industry.filter((i) => i !== value)
        : [...p.industry, value]
    }))
  }

  const isFreeEmail = (email) => {
    const domain = email.split('@')[1]?.toLowerCase()
    return domain && FREE_EMAIL_DOMAINS.includes(domain)
  }

  // Progress = how many steps are DONE (0% on step 1, 100% on step 4)
  const progressPercent = Math.round((step / (STEPS.length - 1)) * 100)

  const validateStep = () => {
    if (step === 0) {
      if (!form.company_name || !form.company_type || form.industry.length === 0) {
        setError('Please fill Company Name, Type and select at least one Industry.')
        return false
      }
    }
    if (step === 1) {
      if (!form.country || !form.state || !form.city || !form.pincode) {
        setError('Please fill Country, State, City and PIN code.')
        return false
      }
    }
    if (step === 2) {
      if (!form.name || !form.designation || !form.official_email) {
        setError('Please fill Name, Designation and Official Email.')
        return false
      }
      if (!form.preferred_contact_method) {
        setError('Please select a preferred contact method.')
        return false
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.')
        return false
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.')
        return false
      }
    }
    if (step === 3) {
      if (!form.legal_business_name) {
        setError('Please enter the legal business entity name.')
        return false
      }
      if (!form.accept_terms || !form.accept_privacy || !form.declare_accuracy ||
          !form.consent_candidate_data || !form.accept_hiring_ethics) {
        setError('Please accept all declarations to submit.')
        return false
      }
    }
    setError(null)
    return true
  }

  const nextStep = () => {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const prevStep = () => {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return

    try {
      setLoading(true)
      setError(null)

      const payload = {
        // login credentials
        name: form.name,
        email: form.official_email,
        password: form.password,

        // recruiter
        phone: form.mobile_number || null,
        designation: form.designation,
        linkedin_url: form.linkedin_url,
        preferred_contact_method: form.preferred_contact_method,

        // company
        company_name: form.company_name,
        company_type: form.company_type,
        company_website: form.company_website,
        company_size: form.company_size,
        industry: form.industry,
        company_description: form.company_description,
        company_logo_url: form.company_logo_url,

        // location
        country: form.country,
        state: form.state,
        city: form.city,
        complete_address: form.complete_address,
        pincode: form.pincode,

        // verification
        legal_business_name: form.legal_business_name,
        gst_number: form.gst_number,
        cin_number: form.cin_number,
        business_registration_url: form.business_registration_url,
        company_domain_proof_url: form.company_domain_proof_url
      }

      const response = await axios.post(`${API_BASE_URL}/recruiter/register`, payload)
      console.log('Registration response:', response.data)

      setSuccess(true)
      setLoading(false)
      setTimeout(() => navigate('/login/recruiter'), 3000)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-24 pb-12 px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition mb-4"
        >
          <span className="text-xl">←</span>
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
            <aside className="bg-gradient-to-b from-green-700 to-teal-700 text-white p-6">
              <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                Recruiter Registration
              </div>
              <h1 className="text-xl font-extrabold mb-1">Hire Verified Talent</h1>
              <p className="text-sm text-white/80 mb-6">
                Register your company and start shortlisting candidates.
              </p>

              <div className="space-y-1">
                {STEPS.map((s, i) => {
                  const active = i === step
                  const done = i < step
                  return (
                    <div key={s.key} className="flex items-start gap-3 py-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        done ? 'bg-white text-green-700' :
                        active ? 'bg-white text-green-700 ring-4 ring-white/30' :
                        'bg-white/20 text-white'
                      }`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-wide ${active ? 'text-white' : 'text-white/60'}`}>
                          Step {i + 1}
                        </p>
                        <p className={`text-sm font-semibold ${active || done ? 'text-white' : 'text-white/70'}`}>
                          {s.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </aside>

            <div className="p-8">
              {/* Header row: step + progress */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                  Step {step + 1} of {STEPS.length}
                </span>
                <span className="text-xs text-gray-500">
                  {progressPercent}% Complete
                </span>
              </div>

              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-teal-600 transition-all"
                  style={{ width: `${Math.max(2, progressPercent)}%` }}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
                   Registration successful! Your account is pending verification. Redirecting to login…
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* STEP 1 — Company Profile */}
                {step === 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Company Profile</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Company Name *</label>
                        <input className={inputClass} value={form.company_name}
                          onChange={(e) => update('company_name', e.target.value)}
                          placeholder="e.g., ABC Technologies Pvt Ltd" required />
                      </div>
                      <div>
                        <label className={labelClass}>Company Type *</label>
                        <select className={inputClass} value={form.company_type}
                          onChange={(e) => update('company_type', e.target.value)} required>
                          <option value="">Select company type</option>
                          {COMPANY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Company Website</label>
                        <input className={inputClass} type="url" value={form.company_website}
                          onChange={(e) => update('company_website', e.target.value)}
                          placeholder="https://example.com" />
                      </div>
                      <div>
                        <label className={labelClass}>Company Size</label>
                        <select className={inputClass} value={form.company_size}
                          onChange={(e) => update('company_size', e.target.value)}>
                          <option value="">Select company size</option>
                          {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Industry * (select all that apply)</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {INDUSTRIES.map((ind) => (
                            <button
                              type="button"
                              key={ind}
                              onClick={() => toggleIndustry(ind)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                form.industry.includes(ind)
                                  ? 'bg-green-600 text-white border-green-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                              }`}
                            >
                              {ind}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Company Logo URL (optional)</label>
                        <input className={inputClass} type="url" value={form.company_logo_url}
                          onChange={(e) => update('company_logo_url', e.target.value)}
                          placeholder="https://example.com/logo.png" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Company Description</label>
                        <textarea className={inputClass} rows="3" value={form.company_description}
                          onChange={(e) => update('company_description', e.target.value)}
                          placeholder="Short description about your company" />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 — Location */}
                {step === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Company Location</h2>
                    <p className="text-sm text-gray-500 mb-6">Head-office or primary hiring location.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Country *</label>
                        <input className={inputClass} value={form.country}
                          onChange={(e) => update('country', e.target.value)} required />
                      </div>
                      <div>
                        <label className={labelClass}>State *</label>
                        <input className={inputClass} value={form.state}
                          onChange={(e) => update('state', e.target.value)}
                          placeholder="Enter state" required />
                      </div>
                      <div>
                        <label className={labelClass}>City *</label>
                        <input className={inputClass} value={form.city}
                          onChange={(e) => update('city', e.target.value)}
                          placeholder="Enter city" required />
                      </div>
                      <div>
                        <label className={labelClass}>PIN Code *</label>
                        <input className={inputClass} value={form.pincode}
                          onChange={(e) => update('pincode', e.target.value)}
                          placeholder="6-digit PIN code" required />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Complete Address</label>
                        <textarea className={inputClass} rows="2" value={form.complete_address}
                          onChange={(e) => update('complete_address', e.target.value)}
                          placeholder="Building, street, area" />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 — Recruiter & Account */}
                {step === 2 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Recruiter & Account</h2>
                    <p className="text-sm text-gray-500 mb-6">
                      You will log in using your official email and password.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Recruiter Full Name *</label>
                        <input className={inputClass} value={form.name}
                          onChange={(e) => update('name', e.target.value)}
                          placeholder="Enter full name" required />
                      </div>
                      <div>
                        <label className={labelClass}>Designation *</label>
                        <select className={inputClass} value={form.designation}
                          onChange={(e) => update('designation', e.target.value)} required>
                          <option value="">Select designation</option>
                          {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Official Company Email * (used for login)</label>
                        <input className={inputClass} type="email" value={form.official_email}
                          onChange={(e) => update('official_email', e.target.value)}
                          placeholder="you@company.com" required />
                        {form.official_email && isFreeEmail(form.official_email) && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠️ Free email domains may delay company verification. Use your company email if possible.
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Mobile Number (optional)</label>
                        <input className={inputClass} type="tel" value={form.mobile_number}
                          onChange={(e) => update('mobile_number', e.target.value)}
                          placeholder="Contact number for verification team" />
                      </div>
                      <div>
                        <label className={labelClass}>LinkedIn / Profile URL</label>
                        <input className={inputClass} type="url" value={form.linkedin_url}
                          onChange={(e) => update('linkedin_url', e.target.value)}
                          placeholder="https://linkedin.com/in/..." />
                      </div>
                      <div>
                        <label className={labelClass}>Preferred Contact Method *</label>
                        <select className={inputClass} value={form.preferred_contact_method}
                          onChange={(e) => update('preferred_contact_method', e.target.value)} required>
                          <option value="">Select method</option>
                          {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Password *</label>
                        <input className={inputClass} type="password" value={form.password}
                          onChange={(e) => update('password', e.target.value)}
                          placeholder="Min 6 characters" required />
                      </div>
                      <div>
                        <label className={labelClass}>Confirm Password *</label>
                        <input className={inputClass} type="password" value={form.confirmPassword}
                          onChange={(e) => update('confirmPassword', e.target.value)}
                          placeholder="Re-enter password" required />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 — Verification & Declarations */}
                {step === 3 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Verification & Submit</h2>
                    <p className="text-sm text-gray-500 mb-6">
                      We verify your company before granting full candidate database access.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={labelClass}>Legal Business / Registered Entity Name *</label>
                        <input className={inputClass} value={form.legal_business_name}
                          onChange={(e) => update('legal_business_name', e.target.value)}
                          placeholder="As per registration certificate" required />
                      </div>
                      <div>
                        <label className={labelClass}>GSTIN</label>
                        <input className={inputClass} value={form.gst_number}
                          onChange={(e) => update('gst_number', e.target.value)}
                          placeholder="Enter GSTIN" />
                      </div>
                      <div>
                        <label className={labelClass}>CIN / Registration Number</label>
                        <input className={inputClass} value={form.cin_number}
                          onChange={(e) => update('cin_number', e.target.value)}
                          placeholder="Enter CIN or registration number" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Business Registration Certificate URL</label>
                        <input className={inputClass} type="url" value={form.business_registration_url}
                          onChange={(e) => update('business_registration_url', e.target.value)}
                          placeholder="Upload to Drive/Dropbox and paste URL" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Company Domain Proof URL</label>
                        <input className={inputClass} type="url" value={form.company_domain_proof_url}
                          onChange={(e) => update('company_domain_proof_url', e.target.value)}
                          placeholder="LinkedIn page, website about page, or domain email proof" />
                      </div>
                    </div>


                    <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
                      {[
                        { key: 'accept_terms', label: 'I accept the Terms and Conditions *' },
                        { key: 'accept_privacy', label: 'I acknowledge the Privacy Policy *' },
                        { key: 'declare_accuracy', label: 'I declare that all information provided is accurate *' },
                        { key: 'consent_candidate_data', label: 'I consent to use candidate data only for legitimate hiring purposes *' },
                        { key: 'accept_hiring_ethics', label: "I agree to follow the platform's hiring ethics and anti-misuse policy *" }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form[key]}
                            onChange={(e) => update(key, e.target.checked)}
                            className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600">
                      <p className="font-semibold text-gray-800 mb-2">Review your submission</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <p><span className="text-gray-500">Company:</span> {form.company_name || '—'}</p>
                        <p><span className="text-gray-500">Type:</span> {form.company_type || '—'}</p>
                        <p><span className="text-gray-500">Industry:</span> {form.industry.join(', ') || '—'}</p>
                        <p><span className="text-gray-500">Location:</span> {[form.city, form.state].filter(Boolean).join(', ') || '—'}</p>
                        <p><span className="text-gray-500">Recruiter:</span> {form.name || '—'}</p>
                        <p><span className="text-gray-500">Login email:</span> {form.official_email || '—'}</p>
                        <p><span className="text-gray-500">Preferred contact:</span> {form.preferred_contact_method || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={step === 0}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition font-semibold"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || success}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 'Submit Registration'}
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login/recruiter')}
                    className="text-green-600 hover:text-green-800 font-medium transition"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecruiterRegistration