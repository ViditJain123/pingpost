"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useImageUpload from '../../hooks/useImageUpload';
import useAudioRecording from '../../hooks/useAudioRecording';
import useModifications from '../../hooks/useModifications';
import useDraftPost from '../../hooks/useDraftPost';
import useGeneratePost from '../../hooks/useGeneratePost';
import usePublishPost from '../../hooks/usePublishPost';
import PreviewModal from './PreviewModal';

// Import the new component files
import TitleInput from './sidebigcard/TitleInput';
import AIPromptSection from './sidebigcard/AIPromptSection';
import APIImageSection from './sidebigcard/APIImageSection';
import ImageUploadSection from './sidebigcard/ImageUploadSection';
import ActionButtons from './sidebigcard/ActionButtons';

const SideBigCard = ({ postId, postData, postContent, onUpdatePostContent, updateGeneratingStatus, isLoading }) => {
  const router = useRouter();
  const [showDraftTooltip, setShowDraftTooltip] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [aiModificationText, setAiModificationText] = useState('');
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  const [isFirstGeneration, setIsFirstGeneration] = useState(false); // Changed to false since we're editing
  const [errorMessage, setErrorMessage] = useState('');
  const [apiImageUrls, setApiImageUrls] = useState([]);
  const [postStatus, setPostStatus] = useState(null);
  const [imageSourceMap, setImageSourceMap] = useState({});
  const [isModifying, setIsModifying] = useState(false);

  const { uploadedImages, handleImageUpload, removeImage: originalRemoveImage, maxImagesReached, imageFiles, addImageFromUrl, clearImages } = useImageUpload(4);
  const { saveDraft, isSaving, saveSuccess, saveError } = useDraftPost();
  const { publishPost, isPublishing, publishSuccess, publishError } = usePublishPost();
  const { generatePost, isGenerating, error: generateError } = useGeneratePost();

  // Set title from post data when available
  useEffect(() => {
    if (postData) {
      setTitle(postData.title || '');
      
      // Handle images if they exist in postData
      if (postData.images && Array.isArray(postData.images) && postData.images.length > 0) {
        // Initialize with existing images
        postData.images.forEach(async (imageUrl) => {
          await addImageFromUrl(imageUrl);
          setImageSourceMap(prev => ({
            ...prev,
            [imageUrl]: 'existing'
          }));
        });
      }
    }
  }, [postData]);
  
  useEffect(() => {
    if (generateError) {
      setErrorMessage(generateError);
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [generateError]);

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
    handleModifyClick, 
    decrementModifications
  } = useModifications(4);

  const handleSaveDraft = async () => {
    setSaveStatus('saving');
    
    try {
      const formData = new FormData();
      formData.append('title', title || 'Untitled');
      formData.append('postContent', postContent || '');
      
      // Prepare array of image URLs to pass to the saveDraft function
      const imageUrlsToSave = [];
      
      // Add uploaded images that came from API (marked in imageSourceMap)
      uploadedImages.forEach(imageUrl => {
        if (imageSourceMap[imageUrl] === 'api') {
          imageUrlsToSave.push(imageUrl);
        }
      });
      
      // Add any remaining API images that weren't selected
      apiImageUrls.forEach(url => {
        imageUrlsToSave.push(url);
      });
      
      // Only add files that are actual File objects (not URLs)
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach(file => {
          // Check if the file is actually a File object and not a string URL
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
      }

      const savedPost = await saveDraft(formData, imageUrlsToSave);
      
      if (savedPost) {
        setSaveStatus('success');
        
        // Clear all inputs after successful save
        setTitle('');
        setAiModificationText('');
        clearImages();
        setApiImageUrls([]);
        setImageSourceMap({});
        onUpdatePostContent(''); // Clear the post content
        
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

  const handleRemoveImage = (index) => {
    const imageUrl = uploadedImages[index];
    const isFromApi = imageSourceMap[imageUrl] === 'api';
    
    // First remove from uploaded images via the original function
    originalRemoveImage(index);
    
    // If this was an API image, add it back to the API images array
    if (isFromApi) {
      setApiImageUrls(prev => [...prev, imageUrl]);
      
      // Remove from the source map
      const updatedSourceMap = {...imageSourceMap};
      delete updatedSourceMap[imageUrl];
      setImageSourceMap(updatedSourceMap);
    }
  };

  // Handler for AI generation (Generate button)
  const handleGenerateButtonClick = async () => {
    if (!title.trim() || !aiModificationText.trim()) {
      setErrorMessage('Please provide both a title and a prompt');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    updateGeneratingStatus(true);
    setIsModifying(true);

    try {
      console.log("Generating content with:", { title, aiModificationText });
      const result = await generatePost(title, aiModificationText);
      
      if (result) {
        console.log("Updating post content:", result.post);
        onUpdatePostContent(result.post);
        
        if (result.images && Array.isArray(result.images) && result.images.length > 0) {
          console.log("Setting API images:", result.images);
          const imagesToShow = result.images.slice(0, 4);
          setApiImageUrls(imagesToShow);
          
          // Reset image source map for new generation
          setImageSourceMap({});
        } else {
          console.warn("No valid images returned from API");
          setApiImageUrls([]);
        }
        
        setAiModificationText('');
        if (isFirstGeneration) {
          setIsFirstGeneration(false);
        } else {
          decrementModifications();
        }
      }
    } catch (error) {
      console.error("Error generating post:", error);
      setErrorMessage('Failed to generate content. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      updateGeneratingStatus(false);
      setIsModifying(false);
    }
  };

  // Handler for saving changes to the post (Modify button)
  const handleModifyButtonClick = async () => {
    if (!title.trim() || !postContent.trim()) {
      setErrorMessage('Please provide both a title and content to save');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setIsModifying(true);
    updateGeneratingStatus(true);

    try {
      if (!postId) {
        setErrorMessage('Post ID is missing. Cannot modify post.');
        return;
      }

      // Call the modifyPost API to save changes
      const modifyResponse = await fetch(`/api/posts/modifyPost?id=${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          postContent: postContent,
        }),
      });

      if (!modifyResponse.ok) {
        const errorData = await modifyResponse.json();
        throw new Error(errorData.error || 'Failed to modify post');
      }

      const result = await modifyResponse.json();
      setErrorMessage('Post updated successfully!'); 
      
      // Show success message briefly, then redirect to home page
      setTimeout(() => {
        router.push('/app/home');
      }, 1500); // Wait 1.5 seconds before redirecting
    } catch (error) {
      console.error("Error modifying post:", error);
      setErrorMessage(error.message || 'Failed to modify post. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsModifying(false);
      updateGeneratingStatus(false);
    }
  };

  const handleSelectAPIImage = async (imageUrl) => {
    try {
      await addImageFromUrl(imageUrl);
      console.log(`Selected image: ${imageUrl}`);
      
      // Remove the selected image from apiImageUrls
      setApiImageUrls(prev => prev.filter(url => url !== imageUrl));
      
      // Mark this image as coming from the API in our source map
      setImageSourceMap(prev => ({
        ...prev,
        [imageUrl]: 'api'
      }));
    } catch (error) {
      console.error("Error adding image:", error);
      setErrorMessage('Failed to add image. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handlePublishPost = async () => {
    if (!postContent || postContent.trim() === '') {
      setErrorMessage('Please generate content before publishing');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }
    
    setPostStatus('posting');
    
    try {
      // Collect all images to send
      const imagesToSend = [...imageFiles];
      
      // Add API-sourced images that were selected
      uploadedImages.forEach(imageUrl => {
        if (imageSourceMap[imageUrl] === 'api') {
          // Include API image URLs
          imagesToSend.push(imageUrl);
        }
      });
      
      const result = await publishPost(postContent, title, imagesToSend);
      
      if (result) {
        setPostStatus('success');
        
        // Clear form data after successful posting
        setTitle('');
        setAiModificationText('');
        clearImages();
        setApiImageUrls([]);
        setImageSourceMap({});
        onUpdatePostContent('');
        
        setTimeout(() => {
          setPostStatus(null);
        }, 3000);
      } else {
        setPostStatus('error');
        setTimeout(() => {
          setPostStatus(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Error publishing post:", error);
      setPostStatus('error');
      setTimeout(() => {
        setPostStatus(null);
      }, 5000);
    }
  };

  // Show loading state while post data is being fetched
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-7 w-full border border-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-7 w-full border border-gray-100">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.push('/app/home')} 
          className="mr-2 text-gray-600 hover:text-gray-900 flex items-center"
          aria-label="Back to home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="ml-1">Back</span>
        </button>
      </div>
      <div className="space-y-5">
        {/* Title input component */}
        <TitleInput 
          title={title} 
          setTitle={setTitle} 
          isGenerating={isGenerating || isModifying} 
          errorMessage={errorMessage} 
        />
        
        {/* AI prompt section component - updated to include both buttons */}
        <AIPromptSection 
          aiModificationText={aiModificationText}
          setAiModificationText={setAiModificationText}
          isFirstGeneration={isFirstGeneration}
          isGenerating={isGenerating || isModifying}
          isRecording={isRecording}
          isProcessing={isProcessing}
          recordingDuration={recordingDuration}
          showMaxDurationAlert={showMaxDurationAlert}
          toggleRecording={toggleRecording}
          handleGenerateButtonClick={handleGenerateButtonClick}
          handleModifyButtonClick={handleModifyButtonClick}
          remainingModifications={remainingModifications}
          showExtraCreditsMessage={showExtraCreditsMessage}
          isEditing={!!postId} // True if we have a postId (editing existing post)
        />
        
        {/* API Image Section component */}
        <APIImageSection 
          apiImageUrls={apiImageUrls}
          handleSelectAPIImage={handleSelectAPIImage}
        />

        {/* Image Upload Section component */}
        <ImageUploadSection 
          uploadedImages={uploadedImages}
          handleImageUpload={handleImageUpload}
          removeImage={handleRemoveImage}
          maxImagesReached={maxImagesReached}
        />

        {/* Action Buttons component */}
        <ActionButtons 
          handleSaveDraft={handleSaveDraft}
          handlePublishPost={handlePublishPost}
          isSaving={isSaving}
          isPublishing={isPublishing}
          isGenerating={isGenerating || isModifying}
          showDraftTooltip={showDraftTooltip}
          setShowDraftTooltip={setShowDraftTooltip}
          setShowPreviewModal={setShowPreviewModal}
          saveStatus={saveStatus}
          postStatus={postStatus}
        />
      </div>
      
      {/* Preview Modal */}
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