"use client"
import React, { useState } from 'react'
import SideBigCard from '@/components/typenoai/SideBigCard'
import PostInput from '@/components/typenoai/postInput'

function Page() {
  const [postContent, setPostContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleContentChange = (content) => {
    setPostContent(content);
  };

  const handleUpdatePostContent = (content) => {
    console.log("Updating post content in page:", content);
    setPostContent(content);
  };

  // This function will be called by the SideBigCard component
  // to update the generation status
  const updateGeneratingStatus = (status) => {
    console.log("Updating generating status:", status);
    setIsGenerating(status);
  };

  return (
    <div className="flex gap-6 p-6 ml-20 mt-16 h-[calc(100vh-4rem)]">
      <div className="w-1/3 max-w-md">
        <SideBigCard 
          postContent={postContent} 
          onUpdatePostContent={handleUpdatePostContent}
          updateGeneratingStatus={updateGeneratingStatus}
        />
      </div>
      <div className="w-2/3 flex flex-col">
        <PostInput 
          onContentChange={handleContentChange} 
          content={postContent} // Pass current content as prop
          isLoading={isGenerating}
        />
      </div>
    </div>
  )
}

export default Page