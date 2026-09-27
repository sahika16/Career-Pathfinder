import React, { useState } from 'react'
import API_BASE_URL from '../../config'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import axios from 'axios'

const INSTITUTE_TYPES = [
  'Private training institute', 'Coaching centre', 'Vocational institute',
  'College / University', 'Online training provider', 'Corporate training provider',
  'NGO / Skill development centre', 'Other'
]

const BUSINESS_CONSTITUTIONS = [
  'Proprietorship', 'Partnership', 'LLP', 'Private limited company',
  'Public limited company', 'Trust', 'Society', 'Educational institution', 'Other'
]

const TRAINING_DOMAINS = [
  'IT / Software', 'Data Science / AI', 'Cloud / DevOps', 'Cybersecurity',
  'Finance / Accounting', 'Healthcare', 'Digital Marketing', 'Engineering',
  'Management', 'Soft Skills', 'Government Exam Preparation', 'Other'
]

const DELIVERY_MODES = ['Classroom', 'Online live', 'Recorded / Self-paced', 'Hybrid']
const FACILITIES = ['Computer lab', 'Wi-Fi', 'Library', 'Practical lab', 'Hostel', 'Transport', 'Accessibility facilities', 'Other']
const CONTACT_METHODS = ['Phone', 'Email', 'WhatsApp']
const DESIGNATIONS = ['Owner', 'Director', 'Partner', 'Principal', 'Centre manager', 'Placement officer', 'Admission counsellor', 'Other']
const COURSE_CATEGORIES = ['IT / Software', 'Data Science / AI', 'Cloud / DevOps', 'Cybersecurity', 'Finance / Accounting', 'Healthcare', 'Digital Marketing', 'Engineering', 'Management', 'Soft Skills', 'Government Exam Preparation', 'Other']
const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const COURSE_TYPES = ['Certification', 'Diploma', 'Job-oriented training', 'Skill development', 'Exam preparation', 'Workshop']
const BATCH_TIMES = ['Weekday', 'Weekend', 'Morning', 'Afternoon', 'Evening']
const STUDY_MATERIAL = ['Included', 'Paid separately', 'Not provided']
const CERTIFICATE_TYPES = ['Institute certificate', 'Industry certificate', 'External certification', 'No certificate']
const PRACTICAL_TRAINING = ['Projects', 'Assignments', 'Lab work', 'Internship', 'Capstone project']
const SELECTION_PROCESS = ['Direct admission', 'Aptitude test', 'Technical test', 'Interview', 'Counselling', 'Other']
const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Other']
const PLACEMENT_SUPPORT = ['Placement assistance available', 'No placement assistance', 'Internship assistance only']
const APPLICATION_METHODS = ['Apply through platform', 'Institute website', 'Contact institute']
const QUALIFICATIONS = ['10th', '12th', 'ITI', 'Diploma', 'BCA', 'BSc / BCS', 'BE / BTech', 'BCom', 'BA', 'BBA', 'MCA', 'MSc', 'MTech', 'Any graduate', 'Any postgraduate']
const STREAMS = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Electrical', 'Civil', 'Commerce', 'Arts', 'Science', 'Any stream', 'Other']
const MARKS_OPTIONS = ['No minimum', '45%', '50%', '55%', '60%', '65%', '70%', 'Custom']
const BACKLOG_OPTIONS = ['No active backlogs', 'Active backlogs allowed', 'Specify number', 'Not applicable']
const GRADUATION_OPTIONS = ['Any year', 'Specific passing year', 'Selectable year range']

const STEPS = [
  { key: 'profile', label: 'Institute Profile' },
  { key: 'contact', label: 'Contact & Authorized Person' },
  { key: 'location', label: 'Location & Facilities' },
  { key: 'courses', label: 'Course Information' },
  { key: 'verification', label: 'Verification & Submission' }
]

function InstituteRegistration() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    institute_name: '',
    display_name: '',
    institute_type: '',
    business_constitution: '',
    year_of_establishment: '',
    institute_website: '',
    institute_logo_url: '',
    about_institute: '',
    primary_training_domain: '',

    contact_person_name: '',
    contact_person_designation: '',
    official_email: '',
    mobile_number: '',
    alternate_contact_number: '',
    preferred_contact_method: '',
    password: '',
    confirmPassword: '',

    country: 'India',
    state: '',
    district: '',
    city: '',
    complete_address: '',
    pincode: '',
    training_delivery_mode: '',
    number_of_centres: '',
    training_centre_addresses: '',
    facilities: [],

    courses: [],

    legal_business_name: '',
    pan_number: '',
    gst_number: '',
    udyam_number: '',
    business_registration_certificate_url: '',
    institute_address_proof_url: '',
    authorized_person_designation: '',
    government_recognition: '',
    recognition_authority: '',
    recognition_number: '',
    recognition_validity: '',
    recognition_evidence_url: '',

    accept_terms: false,
    accept_privacy: false,
    declare_accuracy: false,
    consent_publish: false,
    consent_candidate_enquiries: false
  })

  const [courseDraft, setCourseDraft] = useState({
    course_name: '',
    course_category: '',
    training_mode: '',
    course_duration: '',
    course_fee: '',
    minimum_qualification: '',
    prior_experience: '',
    age_eligibility: '',
    placement_assistance: '',
    course_description: '',
    course_level: '',
    course_type: '',
    batch_availability: '',
    next_batch_start_date: '',
    class_schedule: '',
    seats_available: '',
    admission_deadline: '',
    fee_structure: '',
    study_material: '',
    certificate: '',
    practical_training: '',
    candidate_selection_process: '',
    scholarship_available: '',
    language_of_instruction: '',
    course_brochure_url: '',
    demo_class: '',
    application_method: '',
    eligible_qualifications: [],
    eligible_streams: [],
    minimum_marks: '',
    backlog_criteria: '',
    graduation_year: '',
    preferred_candidate_location: '',
    other_requirements: ''
  })

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }))
  const updateCourse = (field, value) => setCourseDraft((p) => ({ ...p, [field]: value }))

  const toggleFacility = (value) => {
    setForm((p) => ({
      ...p,
      facilities: p.facilities.includes(value)
        ? p.facilities.filter((f) => f !== value)
        : [...p.facilities, value]
    }))
  }

  const toggleMulti = (field, value, target = 'course') => {
    if (target === 'course') {
      setCourseDraft((p) => ({
        ...p,
        [field]: p[field].includes(value)
          ? p[field].filter((v) => v !== value)
          : [...p[field], value]
      }))
    }
  }

  // Progress = how many steps are DONE (0% on step 1, 100% on last step)
  const progressPercent = Math.round((step / (STEPS.length - 1)) * 100)

  const validateStep = () => {
    if (step === 0) {
      if (!form.institute_name || !form.institute_type || !form.primary_training_domain) {
        setError('Please fill all required fields in Institute Profile.')
        return false
      }
    }
    if (step === 1) {
      if (!form.contact_person_name || !form.official_email || !form.mobile_number || !form.password) {
        setError('Please fill all required contact fields.')
        return false
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters')
        return false
      }
    }
    if (step === 2) {
      if (!form.country || !form.state || !form.city || !form.pincode || !form.training_delivery_mode) {
        setError('Please fill required location and delivery details.')
        return false
      }
    }
    if (step === 3) {
      if (form.courses.length === 0) {
        setError('Please add at least one course.')
        return false
      }
    }
    if (step === 4) {
      if (!form.legal_business_name || !form.accept_terms || !form.accept_privacy ||
          !form.declare_accuracy || !form.consent_publish || !form.consent_candidate_enquiries) {
        setError('Please complete all required declarations.')
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

  const addCourse = () => {
    if (!courseDraft.course_name || !courseDraft.course_category || !courseDraft.training_mode ||
        !courseDraft.course_duration || !courseDraft.course_fee || !courseDraft.minimum_qualification) {
      setError('Please fill required course fields.')
      return
    }
    setForm((p) => ({ ...p, courses: [...p.courses, { ...courseDraft }] }))
    setCourseDraft({
      course_name: '', course_category: '', training_mode: '', course_duration: '',
      course_fee: '', minimum_qualification: '', prior_experience: '', age_eligibility: '',
      placement_assistance: '', course_description: '', course_level: '', course_type: '',
      batch_availability: '', next_batch_start_date: '', class_schedule: '',
      seats_available: '', admission_deadline: '', fee_structure: '', study_material: '',
      certificate: '', practical_training: '', candidate_selection_process: '',
      scholarship_available: '', language_of_instruction: '', course_brochure_url: '',
      demo_class: '', application_method: '', eligible_qualifications: [],
      eligible_streams: [], minimum_marks: '', backlog_criteria: '', graduation_year: '',
      preferred_candidate_location: '', other_requirements: ''
    })
    setError(null)
  }

  const removeCourse = (idx) => {
    setForm((p) => ({ ...p, courses: p.courses.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return

    try {
      setLoading(true)
      setError(null)

      const payload = {
        name: form.contact_person_name,
        email: form.official_email,
        phone: form.mobile_number,
        password: form.password,
        institute_name: form.institute_name,
        institute_type: form.institute_type,
        address: form.complete_address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        website: form.institute_website,
        description: form.about_institute,
        contact_person_name: form.contact_person_name,
        contact_person_designation: form.contact_person_designation,
        contact_person_phone: form.mobile_number,
        registration_number: form.recognitions_number || '',
        gst_number: form.gst_number,
        pan_number: form.pan_number,
        partnership_type: form.business_constitution || 'referral',
        display_name: form.display_name,
        business_constitution: form.business_constitution,
        year_of_establishment: form.year_of_establishment,
        primary_training_domain: form.primary_training_domain,
        alternate_contact_number: form.alternate_contact_number,
        preferred_contact_method: form.preferred_contact_method,
        country: form.country,
        district: form.district,
        training_delivery_mode: form.training_delivery_mode,
        number_of_centres: form.number_of_centres,
        training_centre_addresses: form.training_centre_addresses,
        facilities: form.facilities,
        courses: form.courses,
        legal_business_name: form.legal_business_name,
        udyam_number: form.udyam_number,
        government_recognition: form.government_recognition,
        recognition_authority: form.recognition_authority,
        recognition_number: form.recognition_number,
        recognition_validity: form.recognition_validity
      }

      const response = await axios.post(`${API_BASE_URL}/institute/register`, payload)
      console.log('Registration response:', response.data)

      setSuccess(true)
      setLoading(false)
      setTimeout(() => navigate('/login/institute'), 3000)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <div className="max-w-5xl mx-auto pt-24 pb-12 px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition mb-4"
        >
          <span className="text-xl">←</span>
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
            <aside className="bg-gradient-to-b from-blue-700 to-purple-700 text-white p-6">
              <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                Institute Registration
              </div>
              <h1 className="text-xl font-extrabold mb-1">Join the Platform</h1>
              <p className="text-sm text-white/80 mb-6">
                Register your institute and connect with candidates looking for training.
              </p>

              <div className="space-y-1">
                {STEPS.map((s, i) => {
                  const active = i === step
                  const done = i < step
                  return (
                    <div key={s.key} className="flex items-start gap-3 py-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        done ? 'bg-white text-blue-700' :
                        active ? 'bg-white text-blue-700 ring-4 ring-white/30' :
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
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Step {step + 1} of {STEPS.length}
                </span>
                <span className="text-xs text-gray-500">
                  {progressPercent}% Complete
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                  style={{ width: `${Math.max(2, progressPercent)}%` }}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-4 text-sm">
                  Registration successful! Please wait for admin approval.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {step === 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Basic Institute Information</h2>
                    <p className="text-sm text-gray-500 mb-6">Tell us about your institute.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Institute Name *</label>
                        <input className={inputClass} value={form.institute_name}
                          onChange={(e) => update('institute_name', e.target.value)}
                          placeholder="Enter institute name" required />
                      </div>
                      <div>
                        <label className={labelClass}>Display / Brand Name</label>
                        <input className={inputClass} value={form.display_name}
                          onChange={(e) => update('display_name', e.target.value)}
                          placeholder="Enter display name" />
                      </div>
                      <div>
                        <label className={labelClass}>Institute Type *</label>
                        <select className={inputClass} value={form.institute_type}
                          onChange={(e) => update('institute_type', e.target.value)} required>
                          <option value="">Select institute type</option>
                          {INSTITUTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Business Constitution</label>
                        <select className={inputClass} value={form.business_constitution}
                          onChange={(e) => update('business_constitution', e.target.value)}>
                          <option value="">Select business constitution</option>
                          {BUSINESS_CONSTITUTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Year of Establishment</label>
                        <input className={inputClass} type="number" min="1900" max="2100"
                          value={form.year_of_establishment}
                          onChange={(e) => update('year_of_establishment', e.target.value)}
                          placeholder="e.g., 2015" />
                      </div>
                      <div>
                        <label className={labelClass}>Institute Website</label>
                        <input className={inputClass} type="url" value={form.institute_website}
                          onChange={(e) => update('institute_website', e.target.value)}
                          placeholder="https://example.com" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Institute Logo URL (optional)</label>
                        <input className={inputClass} type="url" value={form.institute_logo_url}
                          onChange={(e) => update('institute_logo_url', e.target.value)}
                          placeholder="https://example.com/logo.png" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Primary Training Domain *</label>
                        <select className={inputClass} value={form.primary_training_domain}
                          onChange={(e) => update('primary_training_domain', e.target.value)} required>
                          <option value="">Select training domain</option>
                          {TRAINING_DOMAINS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>About the Institute</label>
                        <textarea className={inputClass} rows="3" value={form.about_institute}
                          onChange={(e) => update('about_institute', e.target.value)}
                          placeholder="Short description about your institute" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Contact & Authorized Person</h2>
                    <p className="text-sm text-gray-500 mb-6">Who manages the account and receives enquiries.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Contact Person's Full Name *</label>
                        <input className={inputClass} value={form.contact_person_name}
                          onChange={(e) => update('contact_person_name', e.target.value)}
                          placeholder="Enter full name" required />
                      </div>
                      <div>
                        <label className={labelClass}>Designation</label>
                        <select className={inputClass} value={form.contact_person_designation}
                          onChange={(e) => update('contact_person_designation', e.target.value)}>
                          <option value="">Select designation</option>
                          {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Official Email *</label>
                        <input className={inputClass} type="email" value={form.official_email}
                          onChange={(e) => update('official_email', e.target.value)}
                          placeholder="institute@example.com" required />
                      </div>
                      <div>
                        <label className={labelClass}>Mobile Number *</label>
                        <input className={inputClass} type="tel" value={form.mobile_number}
                          onChange={(e) => update('mobile_number', e.target.value)}
                          placeholder="Enter mobile number" required />
                      </div>
                      <div>
                        <label className={labelClass}>Alternate Contact Number</label>
                        <input className={inputClass} type="tel" value={form.alternate_contact_number}
                          onChange={(e) => update('alternate_contact_number', e.target.value)}
                          placeholder="Enter alternate contact" />
                      </div>
                      <div>
                        <label className={labelClass}>Preferred Contact Method</label>
                        <select className={inputClass} value={form.preferred_contact_method}
                          onChange={(e) => update('preferred_contact_method', e.target.value)}>
                          <option value="">Select method</option>
                          {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Password *</label>
                        <input className={inputClass} type="password" value={form.password}
                          onChange={(e) => update('password', e.target.value)}
                          placeholder="Create a password" required />
                      </div>
                      <div>
                        <label className={labelClass}>Confirm Password *</label>
                        <input className={inputClass} type="password" value={form.confirmPassword}
                          onChange={(e) => update('confirmPassword', e.target.value)}
                          placeholder="Confirm password" required />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Location & Facilities</h2>
                    <p className="text-sm text-gray-500 mb-6">Where training takes place and how candidates attend.</p>

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
                        <label className={labelClass}>District</label>
                        <input className={inputClass} value={form.district}
                          onChange={(e) => update('district', e.target.value)}
                          placeholder="Enter district" />
                      </div>
                      <div>
                        <label className={labelClass}>City / Town *</label>
                        <input className={inputClass} value={form.city}
                          onChange={(e) => update('city', e.target.value)}
                          placeholder="Enter city" required />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Complete Address</label>
                        <textarea className={inputClass} rows="2" value={form.complete_address}
                          onChange={(e) => update('complete_address', e.target.value)}
                          placeholder="Full address" />
                      </div>
                      <div>
                        <label className={labelClass}>PIN Code *</label>
                        <input className={inputClass} value={form.pincode}
                          onChange={(e) => update('pincode', e.target.value)}
                          placeholder="6-digit PIN code" required />
                      </div>
                      <div>
                        <label className={labelClass}>Training Delivery Mode *</label>
                        <select className={inputClass} value={form.training_delivery_mode}
                          onChange={(e) => update('training_delivery_mode', e.target.value)} required>
                          <option value="">Select mode</option>
                          {DELIVERY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Number of Training Centres</label>
                        <input className={inputClass} type="number" min="1" value={form.number_of_centres}
                          onChange={(e) => update('number_of_centres', e.target.value)}
                          placeholder="e.g., 2" />
                      </div>
                      <div>
                        <label className={labelClass}>Next Batch Start Date</label>
                        <input className={inputClass} type="date" value={form.next_batch_start_date}
                          onChange={(e) => update('next_batch_start_date', e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Training Centre Addresses</label>
                        <textarea className={inputClass} rows="2" value={form.training_centre_addresses}
                          onChange={(e) => update('training_centre_addresses', e.target.value)}
                          placeholder="One address per line for each branch" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Facilities Available</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {FACILITIES.map((f) => (
                            <button
                              type="button"
                              key={f}
                              onClick={() => toggleFacility(f)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                form.facilities.includes(f)
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Course Information</h2>
                    <p className="text-sm text-gray-500 mb-6">Courses offered, eligibility, fees and placement support.</p>

                    {form.courses.length > 0 && (
                      <div className="mb-6 space-y-2">
                        {form.courses.map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                            <div>
                              <p className="font-semibold text-gray-800">{c.course_name}</p>
                              <p className="text-xs text-gray-500">
                                {c.course_category} · {c.training_mode} · ₹{c.course_fee}
                              </p>
                            </div>
                            <button type="button" onClick={() => removeCourse(idx)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                      <h3 className="font-bold text-gray-800 mb-4">Add a Course</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className={labelClass}>Course Name *</label>
                          <input className={inputClass} value={courseDraft.course_name}
                            onChange={(e) => updateCourse('course_name', e.target.value)}
                            placeholder="Enter course name" />
                        </div>
                        <div>
                          <label className={labelClass}>Course Category *</label>
                          <select className={inputClass} value={courseDraft.course_category}
                            onChange={(e) => updateCourse('course_category', e.target.value)}>
                            <option value="">Select category</option>
                            {COURSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Training Mode *</label>
                          <select className={inputClass} value={courseDraft.training_mode}
                            onChange={(e) => updateCourse('training_mode', e.target.value)}>
                            <option value="">Select mode</option>
                            {DELIVERY_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Course Duration *</label>
                          <input className={inputClass} value={courseDraft.course_duration}
                            onChange={(e) => updateCourse('course_duration', e.target.value)}
                            placeholder="e.g., 3 months" />
                        </div>
                        <div>
                          <label className={labelClass}>Course Fee (₹) *</label>
                          <input className={inputClass} type="number" value={courseDraft.course_fee}
                            onChange={(e) => updateCourse('course_fee', e.target.value)}
                            placeholder="e.g., 25000" />
                        </div>
                        <div>
                          <label className={labelClass}>Minimum Educational Qualification *</label>
                          <select className={inputClass} value={courseDraft.minimum_qualification}
                            onChange={(e) => updateCourse('minimum_qualification', e.target.value)}>
                            <option value="">Select minimum qualification</option>
                            {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Prior Experience Required</label>
                          <select className={inputClass} value={courseDraft.prior_experience}
                            onChange={(e) => updateCourse('prior_experience', e.target.value)}>
                            <option value="">Select experience</option>
                            <option value="Fresher">Fresher</option>
                            <option value="0-1 years">0-1 years</option>
                            <option value="1-3 years">1-3 years</option>
                            <option value="3+ years">3+ years</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Age Eligibility</label>
                          <select className={inputClass} value={courseDraft.age_eligibility}
                            onChange={(e) => updateCourse('age_eligibility', e.target.value)}>
                            <option value="">Select age criteria</option>
                            <option value="No age limit">No age limit</option>
                            <option value="18-25">18-25</option>
                            <option value="18-30">18-30</option>
                            <option value="21-35">21-35</option>
                            <option value="Custom">Custom</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Placement Assistance</label>
                          <select className={inputClass} value={courseDraft.placement_assistance}
                            onChange={(e) => updateCourse('placement_assistance', e.target.value)}>
                            <option value="">Select placement support</option>
                            {PLACEMENT_SUPPORT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Course Level</label>
                          <select className={inputClass} value={courseDraft.course_level}
                            onChange={(e) => updateCourse('course_level', e.target.value)}>
                            <option value="">Select level</option>
                            {COURSE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Course Type</label>
                          <select className={inputClass} value={courseDraft.course_type}
                            onChange={(e) => updateCourse('course_type', e.target.value)}>
                            <option value="">Select course type</option>
                            {COURSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Batch Availability</label>
                          <select className={inputClass} value={courseDraft.batch_availability}
                            onChange={(e) => updateCourse('batch_availability', e.target.value)}>
                            <option value="">Select batch timing</option>
                            {BATCH_TIMES.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Seats Available</label>
                          <input className={inputClass} type="number" value={courseDraft.seats_available}
                            onChange={(e) => updateCourse('seats_available', e.target.value)}
                            placeholder="e.g., 30" />
                        </div>
                        <div>
                          <label className={labelClass}>Admission Deadline</label>
                          <input className={inputClass} type="date" value={courseDraft.admission_deadline}
                            onChange={(e) => updateCourse('admission_deadline', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelClass}>Study Material</label>
                          <select className={inputClass} value={courseDraft.study_material}
                            onChange={(e) => updateCourse('study_material', e.target.value)}>
                            <option value="">Select option</option>
                            {STUDY_MATERIAL.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Certificate</label>
                          <select className={inputClass} value={courseDraft.certificate}
                            onChange={(e) => updateCourse('certificate', e.target.value)}>
                            <option value="">Select certificate</option>
                            {CERTIFICATE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Practical Training</label>
                          <select className={inputClass} value={courseDraft.practical_training}
                            onChange={(e) => updateCourse('practical_training', e.target.value)}>
                            <option value="">Select option</option>
                            {PRACTICAL_TRAINING.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Candidate Selection Process</label>
                          <select className={inputClass} value={courseDraft.candidate_selection_process}
                            onChange={(e) => updateCourse('candidate_selection_process', e.target.value)}>
                            <option value="">Select process</option>
                            {SELECTION_PROCESS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Scholarship / Discount</label>
                          <select className={inputClass} value={courseDraft.scholarship_available}
                            onChange={(e) => updateCourse('scholarship_available', e.target.value)}>
                            <option value="">Select</option>
                            <option value="Available">Available</option>
                            <option value="Not available">Not available</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Language of Instruction</label>
                          <select className={inputClass} value={courseDraft.language_of_instruction}
                            onChange={(e) => updateCourse('language_of_instruction', e.target.value)}>
                            <option value="">Select language</option>
                            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Demo Class</label>
                          <select className={inputClass} value={courseDraft.demo_class}
                            onChange={(e) => updateCourse('demo_class', e.target.value)}>
                            <option value="">Select</option>
                            <option value="Available">Available</option>
                            <option value="Not available">Not available</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Application Method</label>
                          <select className={inputClass} value={courseDraft.application_method}
                            onChange={(e) => updateCourse('application_method', e.target.value)}>
                            <option value="">Select method</option>
                            {APPLICATION_METHODS.map((a) => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Course Description and Learning Outcomes</label>
                          <textarea className={inputClass} rows="3" value={courseDraft.course_description}
                            onChange={(e) => updateCourse('course_description', e.target.value)}
                            placeholder="Describe the course and outcomes" />
                        </div>
                      </div>

                      <div className="mt-6 border-t border-gray-200 pt-4">
                        <h4 className="font-bold text-gray-800 mb-3">Candidate Eligibility</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className={labelClass}>Eligible Qualifications</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {QUALIFICATIONS.map((q) => (
                                <button
                                  type="button"
                                  key={q}
                                  onClick={() => toggleMulti('eligible_qualifications', q)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                    courseDraft.eligible_qualifications.includes(q)
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                                  }`}
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className={labelClass}>Eligible Streams / Specializations</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {STREAMS.map((s) => (
                                <button
                                  type="button"
                                  key={s}
                                  onClick={() => toggleMulti('eligible_streams', s)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                    courseDraft.eligible_streams.includes(s)
                                      ? 'bg-purple-600 text-white border-purple-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-500'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Minimum Marks / Percentage</label>
                            <select className={inputClass} value={courseDraft.minimum_marks}
                              onChange={(e) => updateCourse('minimum_marks', e.target.value)}>
                              <option value="">Select minimum marks</option>
                              {MARKS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Backlog Criteria</label>
                            <select className={inputClass} value={courseDraft.backlog_criteria}
                              onChange={(e) => updateCourse('backlog_criteria', e.target.value)}>
                              <option value="">Select criteria</option>
                              {BACKLOG_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Graduation Year</label>
                            <select className={inputClass} value={courseDraft.graduation_year}
                              onChange={(e) => updateCourse('graduation_year', e.target.value)}>
                              <option value="">Select option</option>
                              {GRADUATION_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Preferred Candidate Location</label>
                            <input className={inputClass} value={courseDraft.preferred_candidate_location}
                              onChange={(e) => updateCourse('preferred_candidate_location', e.target.value)}
                              placeholder="e.g., Any location" />
                          </div>
                          <div className="md:col-span-2">
                            <label className={labelClass}>Other Requirements</label>
                            <textarea className={inputClass} rows="2" value={courseDraft.other_requirements}
                              onChange={(e) => updateCourse('other_requirements', e.target.value)}
                              placeholder="English proficiency, laptop, internet, willingness to relocate, etc." />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={addCourse}
                        className="mt-5 w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
                      >
                        + Add Course
                      </button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Verification & Submission</h2>
                    <p className="text-sm text-gray-500 mb-6">Business details, declarations and platform terms.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={labelClass}>Legal Business / Registered Entity Name *</label>
                        <input className={inputClass} value={form.legal_business_name}
                          onChange={(e) => update('legal_business_name', e.target.value)}
                          placeholder="Enter legal entity name" required />
                      </div>
                      <div>
                        <label className={labelClass}>PAN</label>
                        <input className={inputClass} value={form.pan_number}
                          onChange={(e) => update('pan_number', e.target.value)}
                          placeholder="Enter PAN" />
                      </div>
                      <div>
                        <label className={labelClass}>GSTIN</label>
                        <input className={inputClass} value={form.gst_number}
                          onChange={(e) => update('gst_number', e.target.value)}
                          placeholder="Enter GSTIN" />
                      </div>
                      <div>
                        <label className={labelClass}>Udyam Registration Number</label>
                        <input className={inputClass} value={form.udyam_number}
                          onChange={(e) => update('udyam_number', e.target.value)}
                          placeholder="Enter Udyam number" />
                      </div>
                      <div>
                        <label className={labelClass}>Authorized Person's Designation</label>
                        <input className={inputClass} value={form.authorized_person_designation}
                          onChange={(e) => update('authorized_person_designation', e.target.value)}
                          placeholder="Enter designation" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Business Registration Certificate URL</label>
                        <input className={inputClass} type="url" value={form.business_registration_certificate_url}
                          onChange={(e) => update('business_registration_certificate_url', e.target.value)}
                          placeholder="Upload to Drive/Dropbox and paste URL" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Institute Address Proof URL</label>
                        <input className={inputClass} type="url" value={form.institute_address_proof_url}
                          onChange={(e) => update('institute_address_proof_url', e.target.value)}
                          placeholder="Upload proof and paste URL" />
                      </div>

                      <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
                        <h3 className="font-bold text-gray-800 mb-3">Government Recognition (optional)</h3>
                      </div>
                      <div>
                        <label className={labelClass}>Government Recognition</label>
                        <select className={inputClass} value={form.government_recognition}
                          onChange={(e) => update('government_recognition', e.target.value)}>
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Recognition Authority</label>
                        <input className={inputClass} value={form.recognition_authority}
                          onChange={(e) => update('recognition_authority', e.target.value)}
                          placeholder="e.g., NCVET / AICTE / State Board" />
                      </div>
                      <div>
                        <label className={labelClass}>Recognition / Accreditation Number</label>
                        <input className={inputClass} value={form.recognition_number}
                          onChange={(e) => update('recognition_number', e.target.value)}
                          placeholder="Enter number" />
                      </div>
                      <div>
                        <label className={labelClass}>Recognition Validity</label>
                        <input className={inputClass} value={form.recognition_validity}
                          onChange={(e) => update('recognition_validity', e.target.value)}
                          placeholder="e.g., 2024-2027" />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Recognition Evidence URL</label>
                        <input className={inputClass} type="url" value={form.recognition_evidence_url}
                          onChange={(e) => update('recognition_evidence_url', e.target.value)}
                          placeholder="Upload certificate and paste URL" />
                      </div>
                    </div>

                    <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
                      {[
                        { key: 'accept_terms', label: 'I accept the Terms and Conditions *' },
                        { key: 'accept_privacy', label: 'I acknowledge the Privacy Policy *' },
                        { key: 'declare_accuracy', label: 'I declare that all information provided is accurate *' },
                        { key: 'consent_publish', label: 'I consent to publishing my institute and course details *' },
                        { key: 'consent_candidate_enquiries', label: 'I consent to receive candidate enquiries *' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form[key]}
                            onChange={(e) => update(key, e.target.checked)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
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
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-semibold"
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
                    onClick={() => navigate('/login/institute')}
                    className="text-blue-600 hover:text-blue-800 font-medium transition"
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

export default InstituteRegistration