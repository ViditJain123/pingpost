import React from 'react';

const ActionButtons = ({ 
  handleSaveDraft, 
  isSaving, 
  isGenerating, 
  showDraftTooltip, 
  setShowDraftTooltip, 
  setShowPreviewModal, 
  saveStatus 
}) => {
  return (
    <div className="pt-3 space-y-4">
      {/* Save Status Message */}
      {saveStatus && (
        <div className={`p-3 rounded-lg text-sm ${
          saveStatus === 'saving' ? 'bg-blue-50 text-blue-700' : 
          saveStatus === 'success' ? 'bg-green-50 text-green-700' : 
          'bg-red-50 text-red-700'
        }`}>
          {saveStatus === 'saving' && 'Saving your draft...'}
          {saveStatus === 'success' && 'Draft saved successfully!.'}
          {saveStatus === 'error' && 'Error saving draft. Please try again.'}
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative w-1/2">
          <button 
            className={`w-full p-3 rounded-lg border-2 border-dashed font-medium transition-all duration-300 ease-in-out focus:outline-none ${
              isSaving || isGenerating
                ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                : 'bg-white text-[#2563EB] border-[#2563EB] hover:bg-blue-50 active:transform active:scale-95 active:bg-blue-100'
            }`}
            onMouseEnter={() => setShowDraftTooltip(true)}
            onMouseLeave={() => setShowDraftTooltip(false)}
            onClick={handleSaveDraft}
            disabled={isSaving || isGenerating}
          >
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </button>
          {showDraftTooltip && (
            <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-800 text-white text-sm rounded-lg p-3 shadow-lg z-10 animate-fadeIn">
              <div className="absolute left-4 bottom-[-6px] transform rotate-45 w-3 h-3 bg-gray-800"></div>
              You can find all drafts in the Content Calendar page where you can edit or schedule them later.
            </div>
          )}
        </div>
        <div className="relative w-1/2">
          <button 
            className={`w-full p-3 rounded-lg border-2 border-dashed font-medium transition-all duration-300 ease-in-out focus:outline-none ${
              isGenerating
                ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed' 
                : 'bg-white text-[#2563EB] border-[#2563EB] hover:bg-blue-50 active:transform active:scale-95 active:bg-blue-100'
            }`}
            onClick={() => setShowPreviewModal(true)}
            disabled={isGenerating}
          >
            Preview
          </button>
        </div>
      </div>

      <button 
        className={`w-full p-3 rounded-lg font-medium transition-all duration-300 ease-in-out shadow-md focus:outline-none ${
          isGenerating
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-[#2563EB] text-white hover:bg-blue-700 hover:shadow-lg active:transform active:scale-98 active:shadow-sm active:bg-blue-800'
        }`}
        disabled={isGenerating}
      >
        Post
      </button>
    </div>
  );
};

export default ActionButtons;
