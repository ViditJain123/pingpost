import { useState } from 'react';

const useGeneratePostWithLink = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generatePost = async (title, prompt, externalLink = null) => {
    if (!title || !prompt) {
      setError('Please provide a title and a prompt');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    console.log("Starting post generation with:", { title, prompt, externalLink });

    try {
      let endpoint = '/api/posts/generatePost';
      
      // If external link is provided, determine which endpoint to use
      if (externalLink) {
        const isYoutubeLink = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s]+)/.test(externalLink);
        endpoint = isYoutubeLink 
          ? '/api/posts/generatePostYoutube' 
          : '/api/posts/generatePostArticle';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          prompt, 
          articleUrl: externalLink // Pass the link as articleUrl regardless of type 
        }),
      });

      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.message || 'Failed to generate post');
      }

      const data = await response.json();
      console.log("API success response:", data);   
      setIsGenerating(false);
      return data;
    } catch (err) {
      console.error("Generate post error:", err);
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

export default useGeneratePostWithLink;
