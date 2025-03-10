import { useState } from 'react';

const useDraftPost = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const saveDraft = async (formData) => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      const response = await fetch('/api/posts/draftPost', {
        method: 'POST',
        body: formData, // Send FormData directly
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error saving draft');
      }
      
      const data = await response.json();
      setSaveSuccess(true);
      return data.post;
    } catch (error) {
      setSaveError(error.message);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveDraft,
    isSaving,
    saveSuccess,
    saveError,
  };
};

export default useDraftPost;
