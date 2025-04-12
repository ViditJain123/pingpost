import { useState } from 'react';

const useModifyPost = () => {
  const [isModifying, setIsModifying] = useState(false);
  const [modifyError, setModifyError] = useState(null);

  const modifyPost = async (title, content, prompt) => {
    setIsModifying(true);
    setModifyError(null);

    try {
      const response = await fetch('/api/posts/modifyButBasicVersion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          prompt
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to modify post');
      }

      setIsModifying(false);
      return data.post;
    } catch (error) {
      console.error('Error modifying post:', error);
      setModifyError(error.message || 'An error occurred during modification');
      setIsModifying(false);
      return null;
    }
  };

  return {
    modifyPost,
    isModifying,
    modifyError,
  };
};

export default useModifyPost;
