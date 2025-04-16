"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'

const OnboardingForm = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [timezones, setTimezones] = useState([]);
  const [formData, setFormData] = useState({
    linkedinId: '',
    audience: '',
    niche: '',
    narrative: '',
    postExamples: [''],
    postScheduleFix: true,
    postScheduleFixTime: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  });

  useEffect(() => {
    setMounted(true);
    
    // Fetch available timezones
    const fetchTimezones = async () => {
      try {
        const response = await axios.get('/api/timezones');
        if (response.data && response.data.timezones) {
          setTimezones(response.data.timezones);
        }
      } catch (error) {
        console.error('Error fetching timezones:', error);
      }
    };

    const checkUser = async () => {
      try {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          if (key === 'linkedin_profile') {
            try {
              acc[key] = JSON.parse(decodeURIComponent(value));
            } catch {
              acc[key] = value;
            }
          }
          return acc;
        }, {});

        if (cookies.linkedin_profile?.linkedinId) {
          setFormData(prev => ({
            ...prev,
            linkedinId: cookies.linkedin_profile.linkedinId
          }));
          console.log('User already logged in:', cookies.linkedin_profile);
          
          // Check if user has completed onboarding
          const response = await axios.get(`/api/onboard/getUserData`);
          if (response.data && response.data.status === 200 && 
              response.data.body && response.data.body.linkedinSpecs) {
            // Only redirect if linkedinSpecs exists
            router.push('/app/home');
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };

    fetchTimezones();
    checkUser();
  }, [router]);

  if (!mounted) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handlePostExampleChange = (index, value) => {
    const newPostExamples = [...formData.postExamples]
    newPostExamples[index] = value
    setFormData(prev => ({
      ...prev,
      postExamples: newPostExamples
    }))
  }

  const addPostExample = () => {
    setFormData(prev => ({
      ...prev,
      postExamples: [...prev.postExamples, '']
    }))
  }

  const validateCurrentStep = () => {
    switch (step) {
      case 1:
        return formData.audience.trim() !== '' && formData.niche.trim() !== '';
      case 2:
        return formData.narrative.trim() !== '';
      case 3:
        return formData.postExamples.length >= 3 && 
               formData.postExamples.every(example => example.trim() !== '');
      case 4:
        return formData.timezone && formData.postScheduleFixTime;
      default:
        return false;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (step !== 4) return;

    // Validate all fields before submission
    if (!formData.audience || !formData.niche || !formData.narrative || 
        formData.postExamples.length < 3 || 
        !formData.postExamples.every(example => example.trim() !== '') ||
        !formData.timezone || !formData.postScheduleFixTime) {
      alert('Please fill in all fields and provide at least 3 post examples');
      return;
    }

    try {
      await axios.post('/api/onboard/createUser', formData)
      // Handle successful submission here
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting form. Please try again.');
    }
    finally {
      router.push('/app/home')
    }
  }

  return (
    <div className="min-h-screen bg-white p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    step >= i ? 'bg-gradient-to-r from-[#CB2974] to-[#4A3D9B]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    name="audience"
                    value={formData.audience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#CB2974] focus:border-transparent"
                    placeholder="e.g., Tech professionals, entrepreneurs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niche
                  </label>
                  <input
                    type="text"
                    name="niche"
                    value={formData.niche}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#CB2974] focus:border-transparent"
                    placeholder="e.g., Web Development, AI/ML"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Narrative Style
                  </label>
                  <textarea
                    name="narrative"
                    value={formData.narrative}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#CB2974] focus:border-transparent"
                    placeholder="Describe your writing style and tone..."
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Examples
                  </label>
                  {formData.postExamples.map((example, index) => (
                    <div key={index} className="mb-4">
                      <textarea
                        value={example}
                        onChange={(e) => handlePostExampleChange(index, e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#CB2974] focus:border-transparent mb-2"
                        placeholder="Paste a sample post here... (Put atleast 3)"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPostExample}
                    className="text-blue-500 hover:text-blue-600 font-medium"
                  >
                    + Add another example
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Scheduling
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        name="postScheduleFix"
                        id="postScheduleFix"
                        checked={formData.postScheduleFix}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="postScheduleFix" className="ml-2 text-sm font-medium text-gray-700">
                        Enable fixed posting time
                      </label>
                    </div>
                    
                    {formData.postScheduleFix && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Posting Time
                          </label>
                          <input
                            type="time"
                            name="postScheduleFixTime"
                            value={formData.postScheduleFixTime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#CB2974] focus:border-transparent"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Posts will be published at this time according to your selected timezone.
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Timezone
                          </label>
                          <select
                            name="timezone"
                            value={formData.timezone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#CB2974] focus:border-transparent"
                          >
                            {timezones.map((timezone) => (
                              <option key={timezone} value={timezone}>
                                {timezone}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            Your posts will be scheduled according to this timezone.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className={`px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 ${
                  step === 1 ? 'invisible' : ''
                }`}
              >
                Back
              </button>
              <button
                type={step === 4 ? 'submit' : 'button'}
                onClick={() => {
                  if (step !== 4) {
                    if (validateCurrentStep()) {
                      setStep(prev => prev + 1);
                    } else {
                      alert('Please fill in all required fields before proceeding');
                    }
                  }
                }}
                className={`px-6 py-2 rounded-lg bg-gradient-to-r from-[#CB2974] to-[#4A3D9B] text-white hover:opacity-90 transition-colors ${
                  !validateCurrentStep() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!validateCurrentStep()}
              >
                {step === 4 ? 'Submit' : 'Next'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default OnboardingForm