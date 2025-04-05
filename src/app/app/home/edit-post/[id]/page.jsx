"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import SideBigCard from '@/components/edit-post/SideBigCard'
import PostInput from '@/components/edit-post/postInput'

function Page() {
  const { id } = useParams();
  const [postContent, setPostContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [postData, setPostData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch post data when component mounts
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const response = await fetch(`/api/posts/getPostById?id=${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch post data');
        }
        
        const data = await response.json();
        setPostData(data.post);
        setPostContent(data.post.postContent);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching post data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPostData();
    }
  }, [id]);

  // Handler for content changes from PostInput
  const handleContentChange = (content) => {
    setPostContent(content);
  };

  // Handler to update generating status
  const updateGeneratingStatus = (status) => {
    setIsGenerating(status);
  };

  return (
    <div className="flex gap-4 p-4 ml-20 mt-16 h-[calc(100vh-5rem)]">
      <div className="w-1/3">
        <SideBigCard 
          postId={id}
          postData={postData}
          postContent={postContent} 
          onUpdatePostContent={handleContentChange}
          updateGeneratingStatus={updateGeneratingStatus}
          isLoading={isLoading}
        />
      </div>
      <div className="w-2/3 flex flex-col">
        <PostInput 
          onContentChange={handleContentChange} 
          content={postContent} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  )
}

export default Page