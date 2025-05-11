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
  
  // Consolidated loading state
  const isLoading = loadingTitles || loadingPost || isGenerating;
  
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

    // Set a small delay before showing the loading indicator to prevent flashing
    // for quick responses
    const loadingTimer = setTimeout(() => {
      setLoadingPost(true);
    }, 300);
    
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
      clearTimeout(loadingTimer);
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

  // Only show error if we have one
  if (error && !loadingTitles) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <p className="text-red-500 text-md font-medium mb-2">Error loading titles: {error}</p>
        <Button 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 ml-20 mt-16 h-[calc(100vh-4rem)] relative">
      {/* Single combined loading overlay for the entire page - matched with profile page */}
      {(loadingTitles || isGenerating || loadingPost) && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-md font-medium text-gray-700">
            {loadingTitles ? 'Loading titles...' : isGenerating ? 'Generating post...' : 'Loading post...'}
          </p>
        </div>
      )}
      
      {/* Navigation controls */}
      <div className="flex items-center justify-between mb-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={goToPreviousTitle}
            disabled={currentTitleIndex === 0 || loadingPost || isGenerating}
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
            disabled={!selectedTitles || currentTitleIndex >= selectedTitles.length - 1 || loadingPost || isGenerating}
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
        </div>
      </div>
      
      <div className="flex gap-6 flex-1 relative">
        {/* We've consolidated all loading states into one overlay at the page level */}
        
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
            isLoading={false} // We're handling the loading state with the overlay above
            title={currentTitleObj?.title || ""}
            titleStatus={titleStatus}
          />
        </div>
      </div>
    </div>
  )
}

export default StartGenerating
