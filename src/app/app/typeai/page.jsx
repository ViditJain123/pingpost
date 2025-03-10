"use client"

import React, { useState } from 'react'
import SideBigCard from '@/components/typenoai/SideBigCard'
import PostInput from '@/components/typenoai/postInput'

function Page() {
  const [postContent, setPostContent] = useState('');

  // Handler for content changes from PostInput
  const handleContentChange = (content) => {
    setPostContent(content);
  };

  return (
    <div className="flex gap-4 p-4 ml-20 mt-16 h-[calc(100vh-5rem)]">
      <div className="w-1/3">
        <SideBigCard postContent={postContent} />
      </div>
      <div className="w-2/3 flex flex-col">
        <PostInput onContentChange={handleContentChange} />
      </div>
    </div>
  )
}

export default Page