"use client"

import React, { useState, useEffect } from 'react';
import useImageUpload from '../../hooks/useImageUpload';
import useAudioRecording from '../../hooks/useAudioRecording';
import useModifications from '../../hooks/useModifications';
import useDraftPost from '../../hooks/useDraftPost';
import useGeneratePost from '../../hooks/useGeneratePost';
import useModifyPost from '../../hooks/useModifyPost';
import usePublishPost from '../../hooks/usePublishPost';
import PreviewModal from './PreviewModal';

// Import the new component files
import TitleInput from './sidebigcard/TitleInput';
import AIPromptSection from './sidebigcard/AIPromptSection';
import APIImageSection from './sidebigcard/APIImageSection';
import ImageUploadSection from './sidebigcard/ImageUploadSection';
import ActionButtons from './sidebigcard/ActionButtons';

const SideBigCard = ({ postContent, onUpdatePostContent, updateGeneratingStatus }) => {
  const [showDraftTooltip, setShowDraftTooltip] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [aiModificationText, setAiModificationText] = useState('');
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [apiImageUrls, setApiImageUrls] = useState([]);
  const [postStatus, setPostStatus] = useState(null); // 'posting', 'success', 'error'
  const [currentPostId, setCurrentPostId] = useState(null);

  const [imageSourceMap, setImageSourceMap] = useState({});

  const { uploadedImages, handleImageUpload, removeImage: originalRemoveImage, maxImagesReached, imageFiles, addImageFromUrl, clearImages } = useImageUpload(4);
  const { saveDraft, isSaving, saveSuccess, saveError } = useDraftPost();
  const { publishPost, isPublishing, publishSuccess, publishError } = usePublishPost();
  const { generatePost, isGenerating, error: generateError } = useGeneratePost();
  const { modifyPost, isModifying, modifyError } = useModifyPost();
  
  useEffect(() => {
    if (generateError) {
      setErrorMessage(generateError);
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [generateError]);

  useEffect(() => {
    if (modifyError) {
      setErrorMessage(modifyError);
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [modifyError]);

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
        setIsFirstGeneration(true); // Reset to show Generate button instead of Modify
        setCurrentPostId(null); // Reset post ID
        
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

  // Enhanced remove image function that handles returning API images to the apiImageUrls array
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

  const handleModifyButtonClick = async () => {
    if (!title.trim() || !aiModificationText.trim()) {
      setErrorMessage('Please provide both a title and a prompt');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    updateGeneratingStatus(true);

    if (isFirstGeneration) {
      try {
        console.log("Generating first post with:", { title, aiModificationText });
        const result = await generatePost(title, aiModificationText);
        console.log("Generation result:", result);
        
        if (result) {
          console.log("Updating post content:", result.post);
          onUpdatePostContent(result.post);
          
          // Store the post ID for future modifications
          if (result._id) {
            setCurrentPostId(result._id);
          }
          
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
          setIsFirstGeneration(false);
        }
      } catch (error) {
        console.error("Error generating post:", error);
        setErrorMessage('Failed to generate post. Please try again.');
        setTimeout(() => setErrorMessage(''), 5000);
      } finally {
        updateGeneratingStatus(false);
      }
    } else {
      decrementModifications();
      try {
        console.log("Modifying post with:", { title, content: postContent, prompt: aiModificationText });
        
        // Send the current post content along with title and prompt
        const result = await modifyPost(title, postContent, aiModificationText);
        console.log("Modification result:", result);
        
        if (result) {
          console.log("Updating post content:", result.content);
          onUpdatePostContent(result.content);
          
          // If the API returns images, handle them
          if (result.images && Array.isArray(result.images) && result.images.length > 0) {
            console.log("Setting API images:", result.images);
            const imagesToShow = result.images.slice(0, 4);
            setApiImageUrls(prevUrls => {
              // Only add images that don't already exist in the source map
              const newImageUrls = imagesToShow.filter(url => !imageSourceMap[url]);
              return [...prevUrls, ...newImageUrls].slice(0, 4);
            });
          }
          
          setAiModificationText('');
        }
      } catch (error) {
        console.error("Error modifying post:", error);
        setErrorMessage('Failed to modify post. Please try again.');
        setTimeout(() => setErrorMessage(''), 5000);
      } finally {
        updateGeneratingStatus(false);
      }
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
        setIsFirstGeneration(true); // Reset to show Generate button instead of Modify
        setCurrentPostId(null); // Reset post ID
        
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-7 w-full border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Write your post</h2>
      <div className="space-y-5">
        {/* Title input component */}
        <TitleInput 
          title={title} 
          setTitle={setTitle} 
          isGenerating={isGenerating} 
          errorMessage={errorMessage} 
        />
        
        {/* AI prompt section component */}
        <AIPromptSection 
          aiModificationText={aiModificationText}
          setAiModificationText={setAiModificationText}
          isFirstGeneration={isFirstGeneration}
          isGenerating={isGenerating}
          isRecording={isRecording}
          isProcessing={isProcessing}
          recordingDuration={recordingDuration}
          showMaxDurationAlert={showMaxDurationAlert}
          toggleRecording={toggleRecording}
          handleModifyButtonClick={handleModifyButtonClick}
          remainingModifications={remainingModifications}
          showExtraCreditsMessage={showExtraCreditsMessage}
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

        {/* Action Buttons component - Updated to include Post button */}
        <ActionButtons 
          handleSaveDraft={handleSaveDraft}
          handlePublishPost={handlePublishPost}
          isSaving={isSaving}
          isPublishing={isPublishing}
          isGenerating={isGenerating}
          showDraftTooltip={showDraftTooltip}
          setShowDraftTooltip={setShowDraftTooltip}
          setShowPreviewModal={setShowPreviewModal}
          saveStatus={saveStatus}
          postStatus={postStatus}
        />
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