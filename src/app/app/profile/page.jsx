"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubscriptionCard from '../../../components/subscription/subsCard';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const [formData, setFormData] = useState({
    audience: '',
    niche: '',
    narrative: '',
    postExamples: [],
    postScheduleFix: false,
    postScheduleFixTime: null,
  });

  // For modal state (edit example)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/api/user/profile');
      setUserData(response.data);

      // Initialize form data with user's linkedinSpecs if available
      if (response.data.linkedinSpecs) {
        setFormData({
          audience: response.data.linkedinSpecs.audience || '',
          niche: response.data.linkedinSpecs.niche || '',
          narrative: response.data.linkedinSpecs.narrative || '',
          postExamples: response.data.linkedinSpecs.postExamples || [],
          postScheduleFix: response.data.linkedinSpecs.postScheduleFix || false,
          postScheduleFixTime:
            response.data.linkedinSpecs.postScheduleFixTime || null,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    // If it's the time input, store the raw string or handle it accordingly
    if (type === 'time') {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePostExamplesChange = (e, index) => {
    const newPostExamples = [...formData.postExamples];
    newPostExamples[index] = e.target.value;
    setFormData({ ...formData, postExamples: newPostExamples });
  };

  const addPostExample = () => {
    setFormData({ ...formData, postExamples: [...formData.postExamples, ''] });
  };

  const removePostExample = (index) => {
    const newPostExamples = [...formData.postExamples];
    newPostExamples.splice(index, 1);
    setFormData({ ...formData, postExamples: newPostExamples });
  };

  const handleToggleChange = () => {
    setFormData({ ...formData, postScheduleFix: !formData.postScheduleFix });
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await axios.put('/api/user/linkedinSpecs', {
        linkedinSpecs: formData,
      });
      await fetchUserData();
      alert('LinkedIn Specs saved successfully!');
    } catch (error) {
      console.error('Error saving LinkedIn specs:', error);
      alert('Failed to save LinkedIn specs');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (index) => {
    setCurrentEditIndex(index);
    setEditValue(formData.postExamples[index]);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setCurrentEditIndex(null);
    setEditValue('');
  };

  const saveEditedExample = () => {
    if (currentEditIndex !== null) {
      const newPostExamples = [...formData.postExamples];
      newPostExamples[currentEditIndex] = editValue;
      setFormData({ ...formData, postExamples: newPostExamples });
      closeEditModal();
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const toggleSubscriptionModal = () => {
    setShowSubscriptionModal(!showSubscriptionModal);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 pt-20">
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-8 text-center">Profile Settings</h1>

      {/* User Profile Card */}
      <div className="mb-10 shadow-md rounded-lg overflow-hidden bg-white">
        <div className="flex justify-between p-6 bg-gradient-to-r from-blue-100 to-purple-100">
          <div className="flex gap-4">
            <img
              src={userData?.profilePicture || '/default-avatar.png'}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-white object-cover"
            />
            <div className="flex flex-col justify-center">
              <p className="text-2xl font-bold">
                {userData?.firstName} {userData?.lastName}
              </p>
              <p className="text-gray-700">{userData?.email}</p>
              <div className="mt-2">
                <span
                  className={`inline-block px-3 py-1 text-sm rounded-full ${
                    !userData?.subscription || userData?.subscription?.plan === 'free' || userData?.subscription?.plan === 'freeTrial'
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {!userData?.subscription
                    ? 'Free Plan'
                    : userData?.subscription?.plan === 'free' || userData?.subscription?.plan === 'freeTrial'
                    ? 'Free Plan'
                    : userData?.subscription?.plan === 'premiumMonthly'
                    ? 'Premium Monthly'
                    : 'Premium Yearly'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Upgrade Plan Button - only shown for non-premium users */}
          {(!userData?.subscription || 
            userData?.subscription?.plan === 'free' || 
            userData?.subscription?.plan === 'freeTrial') && (
            <div className="flex items-center">
              <button
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md shadow-md hover:from-blue-600 hover:to-purple-600 transition-all font-medium"
                onClick={toggleSubscriptionModal}
              >
                Upgrade Plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LinkedIn Specs Card (Header Removed) */}
      <div className="shadow-md rounded-lg overflow-hidden bg-white">
        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Target Audience
            </label>
            <input
              name="audience"
              value={formData.audience}
              onChange={handleInputChange}
              placeholder="Describe your target audience"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Niche/Industry */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Niche/Industry
            </label>
            <input
              name="niche"
              value={formData.niche}
              onChange={handleInputChange}
              placeholder="Your niche or industry focus"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Narrative Style */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Narrative Style
            </label>
            <textarea
              name="narrative"
              value={formData.narrative}
              onChange={handleInputChange}
              placeholder="Describe your preferred narrative style"
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Post Examples */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Post Examples
              </label>
              <button
                onClick={addPostExample}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                Add New
              </button>
            </div>

            {formData.postExamples.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
                No example posts added yet. Add some to help generate content.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.postExamples.map((example, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
                  >
                    <p className="text-sm text-gray-700 truncate flex-1 mr-3">
                      {truncateText(example)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(index)}
                        className="text-sm px-2 py-1 rounded border border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removePostExample(index)}
                        className="text-sm px-2 py-1 rounded border border-red-600 text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Post Scheduling */}
          <div className="border border-gray-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-center p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-blue-600 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <h3 className="text-lg font-semibold text-gray-800">
                  Post Scheduling
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    formData.postScheduleFix ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {formData.postScheduleFix ? 'Enabled' : 'Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={formData.postScheduleFix}
                  onChange={handleToggleChange}
                  className="toggle-checkbox h-5 w-5"
                />
              </div>
            </div>

            {formData.postScheduleFix && (
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  When enabled, your LinkedIn posts will be scheduled to publish
                  at the specified time.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Select Default Posting Time
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      name="postScheduleFixTime"
                      value={
                        formData.postScheduleFixTime || ''
                      }
                      onChange={handleInputChange}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-[120px]"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-gray-400 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Posts will be published at this time on the day you schedule
                    them.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={saveChanges}
            disabled={saving}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-4 py-3 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Saving Changes...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Edit Post Example Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          {/* Modal container */}
          <div className="bg-white rounded-md shadow-lg w-full max-w-xl mx-4">
            {/* Modal header */}
            <div className="border-b p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Edit Example Post</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your example post"
              />
            </div>

            {/* Modal footer */}
            <div className="border-t p-4 flex justify-end gap-2">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedExample}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
              <button onClick={toggleSubscriptionModal} className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-4">
              <SubscriptionCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;