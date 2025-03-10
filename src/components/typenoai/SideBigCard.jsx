"use client"

import React, { useState } from 'react';
import useImageUpload from '../../hooks/useImageUpload';
import useAudioRecording from '../../hooks/useAudioRecording';
import useModifications from '../../hooks/useModifications';
import useDraftPost from '../../hooks/useDraftPost';
import PreviewModal from './PreviewModal';

const SideBigCard = ({ postContent }) => {
  const [showDraftTooltip, setShowDraftTooltip] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [aiModificationText, setAiModificationText] = useState('');
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  
  // Custom hooks
  const { uploadedImages, handleImageUpload, removeImage, maxImagesReached, imageFiles } = useImageUpload(4);
  const { saveDraft, isSaving, saveSuccess, saveError } = useDraftPost();
  
  const handleTranscriptionComplete = (text) => {
    setAiModificationText(prevText => {
      if (prevText.trim() === "") {
        return text;
      } else {
        return `${prevText} ${text}`;
      }
    });
  };

  const { 
    isRecording, 
    isProcessing, 
    recordingDuration, 
    showMaxDurationAlert, 
    toggleRecording,
  } = useAudioRecording(handleTranscriptionComplete);
  
  const { 
    remainingModifications, 
    showExtraCreditsMessage, 
    handleModifyClick 
  } = useModifications(4);

  const handleSaveDraft = async () => {
    setSaveStatus('saving');
    
    try {
      // Create FormData to match backend expectations
      const formData = new FormData();
      formData.append('title', title || 'Untitled');
      formData.append('postContent', postContent || '');
      
      // Append each image file separately
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach(file => {
          formData.append('images', file);
        });
      }

      const savedPost = await saveDraft(formData);
      
      if (savedPost) {
        setSaveStatus('success');
        // Optional: Reset form or show success message
        setTimeout(() => {
          setSaveStatus(null);
        }, 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      setSaveStatus('error');
    }
  };

  const ImageUploadButton = () => (
    <label className="aspect-square flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200">
      <div className="flex flex-col items-center justify-center">
        <svg className="w-8 h-8 mb-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <p className="text-sm text-gray-500">Add image</p>
      </div>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </label>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-7 w-full border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Write your post</h2>
      <div className="space-y-5">
        <input
          type="text"
          placeholder="Title"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 font-medium"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        {/* AI Modification Text Box */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              placeholder="Enter modifications you want to make using AI"
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 min-h-[100px] resize-y"
              value={aiModificationText}
              onChange={(e) => setAiModificationText(e.target.value)}
            />
            <div className="absolute top-3 right-3 flex items-center">
              {isRecording && (
                <span className="mr-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              )}
              <button
                onClick={toggleRecording}
                disabled={isProcessing}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isProcessing 
                    ? 'bg-blue-100 text-blue-600 cursor-wait' 
                    : isRecording 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={
                  isProcessing 
                    ? "Processing audio..." 
                    : isRecording 
                    ? "Stop recording" 
                    : "Start voice input"
                }
              >
                {isProcessing ? (
                  <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isRecording ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 8H16V16H8V8Z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 10V12C19 15.866 15.866 19 12 19M12 19C8.13401 19 5 15.866 5 12V10M12 19V22M8 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Maximum duration alert */}
          {showMaxDurationAlert && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm flex items-start animate-fadeIn">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Recording reached maximum duration of 2 minutes and was automatically stopped.</span>
            </div>
          )}
          
          <button 
            onClick={handleModifyClick}
            className="w-full p-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg flex items-center justify-center transition-all duration-200"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M8 9L11.5 5.5M16 4L15 8L19 12L15 16L16 20L12 19L8 20L9 16L5 12L9 8L8 4L12 5L16 4Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            Modify ({remainingModifications}/4)
          </button>
        </div>
        
        {/* Extra Credits Message */}
        {showExtraCreditsMessage && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 shadow-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 11-2 0 1 1 012 0zM9 9a1 1 000 2v3a1 1 001 1h1a1 1 100-2h-1V9z" clipRule="evenodd" />
              </svg>
              <span>You've used all your free modifications. Additional modifications will cost extra credits.</span>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Add up to 4 images:</p>
          <div className="grid grid-cols-4 gap-3">
            {uploadedImages.map((img, index) => (
              <div key={index} className="relative aspect-square group">
                <img
                  src={img}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg shadow-sm"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-gray-200 text-black p-1.5 rounded-full hover:bg-gray-300 transition-colors opacity-90 hover:opacity-100 shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {!maxImagesReached && <ImageUploadButton />}
          </div>
        </div>

        {/* Save Status Message */}
        {saveStatus && (
          <div className={`p-3 rounded-lg text-sm ${
            saveStatus === 'saving' ? 'bg-blue-50 text-blue-700' : 
            saveStatus === 'success' ? 'bg-green-50 text-green-700' : 
            'bg-red-50 text-red-700'
          }`}>
            {saveStatus === 'saving' && 'Saving your draft...'}
            {saveStatus === 'success' && 'Draft saved successfully!'}
            {saveStatus === 'error' && 'Error saving draft. Please try again.'}
          </div>
        )}

        <div className="pt-3 space-y-4">
          <div className="flex gap-3">
            <div className="relative w-1/2">
              <button 
                className={`w-full p-3 rounded-lg border-2 border-dashed font-medium transition-all duration-300 ease-in-out focus:outline-none ${
                  isSaving
                    ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                    : 'bg-white text-[#2563EB] border-[#2563EB] hover:bg-blue-50 active:transform active:scale-95 active:bg-blue-100'
                }`}
                onMouseEnter={() => setShowDraftTooltip(true)}
                onMouseLeave={() => setShowDraftTooltip(false)}
                onClick={handleSaveDraft}
                disabled={isSaving}
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
                className="w-full p-3 bg-white text-[#2563EB] rounded-lg border-2 border-dashed border-[#2563EB] hover:bg-blue-50 transition-all duration-300 ease-in-out font-medium active:transform active:scale-95 active:bg-blue-100 focus:outline-none"
                onClick={() => setShowPreviewModal(true)}
              >
                Preview
              </button>
            </div>
          </div>

          <button className="w-full p-3 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg font-medium active:transform active:scale-98 active:shadow-sm active:bg-blue-800 focus:outline-none">
            Post
          </button>
        </div>
      </div>
      
      {/* Preview Modal - Pass the postContent from props */}
      <PreviewModal 
        isOpen={showPreviewModal} 
        onClose={() => setShowPreviewModal(false)}
        postContent={postContent}
        postTitle={title}
        postImages={uploadedImages}
      />
    </div>
  );
};

export default SideBigCard;