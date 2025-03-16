import { useState } from 'react';

const useGeneratePostFromArticle = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generatePost = async (title, prompt, articleUrl) => {
    if (!title || !prompt || !articleUrl) {
      setError('Please provide a title, a article url and a prompt');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    console.log("Starting post generation with:", { title, prompt, articleUrl });

    try {
      const response = await fetch('/api/posts/generatePostArticle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, prompt, articleUrl }),
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

export default useGeneratePostFromArticle;
