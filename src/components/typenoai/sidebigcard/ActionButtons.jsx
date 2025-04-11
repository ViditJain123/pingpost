import React, { useState } from 'react';
import { FaRegSave, FaCheck, FaTimes, FaEye, FaLinkedin, FaTrash } from 'react-icons/fa';
import { RiLoader4Line } from 'react-icons/ri';

const ActionButtons = ({
  handleSaveDraft,
  handlePublishPost,
  isSaving, 
  isPublishing,
  isGenerating,
  showDraftTooltip,
  setShowDraftTooltip,
  setShowPreviewModal,
  saveStatus,
  postStatus
}) => {
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  
  const handleDiscardPost = () => {
    setShowDiscardConfirmation(true);
  };
  
  const confirmDiscard = () => {
    setShowDiscardConfirmation(false);
    window.location.reload();
  };

  return (
    <div className="flex justify-center items-center mt-6 gap-3">
      <div className="relative">
        <button
          onClick={handleSaveDraft}
          disabled={isSaving || isGenerating}
          className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition w-24 ${
            isSaving || isGenerating
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
          Save
        </button>
        {showDraftTooltip && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
            Save as draft for later
          </div>
        )}
      </div>
      
      <button
        onClick={handleDiscardPost}
        disabled={isPublishing || isSaving || isGenerating}
        className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition w-24 ${
          isPublishing || isSaving || isGenerating
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-red-100 text-red-700 hover:bg-red-200'
        }`}
      >
        <FaTrash className="mr-1" />
        Discard
      </button>
      
      <button
        onClick={() => setShowPreviewModal(true)}
        disabled={isGenerating}
        className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition w-24 ${
          isGenerating
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <FaEye className="mr-1" />
        Preview
      </button>
      
      <button
        onClick={handlePublishPost}
        disabled={isPublishing || isGenerating}
        className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition w-24 ${
          isPublishing || isGenerating
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

      {showDiscardConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
            <h3 className="text-lg font-medium mb-4">Confirm Discard</h3>
            <p className="mb-6">Are you sure you want to discard this post and start over?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDiscardConfirmation(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDiscard}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
