import { useState } from 'react';

const usePublishPost = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState(null);

  const publishPost = async (content, title, images, visibility = 'PUBLIC') => {
    setIsPublishing(true);
    setPublishSuccess(false);
    setPublishError(null);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('title', title);
      formData.append('visibility', visibility);

      // Append any image files
      if (images && images.length > 0) {
        images.forEach((image, index) => {
          if (image instanceof File) {
            formData.append('images', image);
          } else if (typeof image === 'string') {
            // For URLs, send them as separate fields
            formData.append('imageUrls', image);
          }
        });
      }

      const response = await fetch('/api/posts/publishPost', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish post');
      }

      setPublishSuccess(true);
      return data;
    } catch (error) {
      console.error('Error publishing post:', error);
      setPublishError(error.message || 'Failed to publish post');
      return null;
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    publishPost,
    isPublishing,
    publishSuccess,
    publishError,
  };
};

export default usePublishPost;
