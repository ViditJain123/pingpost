import { useState } from 'react';

const useGenerateYoutubePost = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generatePost = async (title, prompt, videoUrl) => {
    if (!title || !prompt || !videoUrl) {
      setError('Please provide a title, prompt, and YouTube video URL');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    console.log("Starting YouTube post generation with:", { title, prompt, videoUrl });

    try {
      const response = await fetch('/api/posts/generatePostYoutube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, prompt, videoUrl }),
      });

      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.message || 'Failed to generate post from YouTube video');
      }

      const data = await response.json();
      console.log("API success response:", data);   
      setIsGenerating(false);
      return data;
    } catch (err) {
      console.error("Generate YouTube post error:", err);
      setError(err.message || 'An error occurred while generating the post');
      setIsGenerating(false);
      return null;
    }
  };

  return {
    generatePost,
    isGenerating,
    error,
    clearError: () => setError(null),
  };
};

export default useGenerateYoutubePost;
