import React from 'react';
import { FaRegSave, FaCheck, FaTimes, FaEye, FaLinkedin } from 'react-icons/fa';
import { RiLoader4Line } from 'react-icons/ri';

const ActionButtons = ({
  handleSaveDraft,
  handlePublishPost,
  isSaving,
  isPublishing,
  isGenerating,
  isRecording,
  isProcessing,
  showDraftTooltip,
  setShowDraftTooltip,
  setShowPreviewModal,
  saveStatus,
  postStatus
}) => {
  // Combine all states that should disable buttons
  const isDisabled = isSaving || isGenerating || isPublishing || isRecording || isProcessing;

  return (
    <div className="flex justify-between items-center mt-6 space-x-3">
      <div className="relative">
        <button
          onClick={handleSaveDraft}
          disabled={isDisabled}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
            isDisabled
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onMouseEnter={() => setShowDraftTooltip(true)}
          onMouseLeave={() => setShowDraftTooltip(false)}
        >
          {saveStatus === 'saving' ? (
            <RiLoader4Line className="animate-spin mr-1" />
          ) : saveStatus === 'success' ? (
            <FaCheck className="mr-1 text-green-500" />
          ) : saveStatus === 'error' ? (
            <FaTimes className="mr-1 text-red-500" />
          ) : (
            <FaRegSave className="mr-1" />
          )}
          Save Draft
        </button>
        {showDraftTooltip && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
            Save as draft for later
          </div>
        )}
      </div>
      
      <button
        onClick={() => setShowPreviewModal(true)}
        disabled={isDisabled}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
          isDisabled
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <FaEye className="mr-1" />
        Preview
      </button>
      
      <button
        onClick={handlePublishPost}
        disabled={isDisabled}
        className={`flex items-center px-6 py-2 rounded-lg text-sm font-medium transition ${
          isDisabled
            ? 'bg-blue-300 text-white cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {postStatus === 'posting' ? (
          <RiLoader4Line className="animate-spin mr-1" />
        ) : postStatus === 'success' ? (
          <FaCheck className="mr-1" />
        ) : postStatus === 'error' ? (
          <FaTimes className="mr-1" />
        ) : (
          <FaLinkedin className="mr-1" />
        )}
        {postStatus === 'posting' ? 'Posting...' : 
          postStatus === 'success' ? 'Posted!' : 
          postStatus === 'error' ? 'Failed' : 'Post'}
      </button>
    </div>
  );
};

export default ActionButtons;
