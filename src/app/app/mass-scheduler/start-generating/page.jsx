"use client"
import React, { useState, useEffect } from 'react'
import SideBigCard from '@/components/mass-schedular/SideBigCard'
import PostInput from '@/components/mass-schedular/postInput'
import useGetSelectedTitles from '@/hooks/useGetSelectedTitles'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function StartGenerating() {
  const [postContent, setPostContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { titles: selectedTitles, loading: loadingTitles, error } = useGetSelectedTitles();
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [loadingPost, setLoadingPost] = useState(false);
  const [currentTitleObj, setCurrentTitleObj] = useState(null);
  const [titleStatus, setTitleStatus] = useState('unselected');
  
  useEffect(() => {
    // When selected titles are loaded, set the current title to the first one
    if (selectedTitles && selectedTitles.length > 0 && !currentTitleObj) {
      setCurrentTitleObj(selectedTitles[0]);
      fetchPostContent(selectedTitles[0].title);
    }
  }, [selectedTitles]);

  // Fetch post content whenever current title changes
  useEffect(() => {
    if (currentTitleObj) {
      fetchPostContent(currentTitleObj.title);
    }
  }, [currentTitleObj]);

  const fetchPostContent = async (titleText) => {
    if (!titleText) return;

    setLoadingPost(true);
    try {
      const response = await fetch('/api/posts/massSchedular/getPostContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: titleText }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPostContent(data.content);
        setTitleStatus(data.titleStatus);
      } else {
        // If post not generated yet or error occurred
        setPostContent('');
        setTitleStatus('unselected');
      }
    } catch (error) {
      console.error("Error fetching post content:", error);
      toast.error("Failed to fetch post content");
      setPostContent('');
    } finally {
      setLoadingPost(false);
    }
  };
  
  const handleContentChange = (content) => {
    setPostContent(content);
  };

  const handleUpdatePostContent = async (content) => {
    console.log("Updating post content in page:", content);
    setPostContent(content);
    
    // Mark the title as generated when content is updated
    if (content && currentTitleObj?.title) {
      try {
        const response = await fetch('/api/posts/massSchedular/updateTitleStatus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            title: currentTitleObj.title, 
            titleStatus: 'generated' 
          }),
        });
        
        if (response.ok) {
          setTitleStatus('generated');
          // Also update the local title object
          if (selectedTitles) {
            const updatedTitles = [...selectedTitles];
            updatedTitles[currentTitleIndex] = {
              ...updatedTitles[currentTitleIndex],
              titleStatus: 'generated'
            };
            // Note: This won't persist across page refreshes unless your useGetSelectedTitles hook refetches
          }
        }
      } catch (error) {
        console.error("Error updating title status:", error);
      }
    }
  };

  const updateGeneratingStatus = (status) => {
    console.log("Updating generating status:", status);
    setIsGenerating(status);
  };

  const goToPreviousTitle = () => {
    if (currentTitleIndex > 0) {
      const newIndex = currentTitleIndex - 1;
      setCurrentTitleIndex(newIndex);
      setCurrentTitleObj(selectedTitles[newIndex]);
    }
  };

  const goToNextTitle = () => {
    if (selectedTitles && currentTitleIndex < selectedTitles.length - 1) {
      const newIndex = currentTitleIndex + 1;
      setCurrentTitleIndex(newIndex);
      setCurrentTitleObj(selectedTitles[newIndex]);
    }
  };

  if (loadingTitles) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="ml-2">Loading titles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Error loading titles: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 ml-20 mt-16 h-[calc(100vh-4rem)]">
      {/* Navigation controls */}
      <div className="flex items-center justify-between mb-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={goToPreviousTitle}
            disabled={currentTitleIndex === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-sm">
            <span className="font-medium">Title {currentTitleIndex + 1}/{selectedTitles?.length || 0}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={goToNextTitle}
            disabled={!selectedTitles || currentTitleIndex >= selectedTitles.length - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-sm font-medium text-gray-700 flex items-center">
          {currentTitleObj?.title || ""}
          {titleStatus === 'generated' && (
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
              Generated
            </span>
          )}
          {loadingPost && <Loader2 className="inline-block h-3 w-3 animate-spin ml-2" />}
        </div>
      </div>
      
      <div className="flex gap-6 flex-1">
        <div className="w-1/3 max-w-md">
          <SideBigCard 
            postContent={postContent} 
            onUpdatePostContent={handleUpdatePostContent}
            updateGeneratingStatus={updateGeneratingStatus}
            currentTitle={currentTitleObj?.title || ""}
            titleStatus={titleStatus}
          />
        </div>
        <div className="w-2/3 flex flex-col">
          <PostInput 
            onContentChange={handleContentChange} 
            content={postContent}
            isLoading={isGenerating || loadingPost}
            title={currentTitleObj?.title || ""}
            titleStatus={titleStatus}
          />
        </div>
      </div>
    </div>
  )
}

export default StartGenerating
