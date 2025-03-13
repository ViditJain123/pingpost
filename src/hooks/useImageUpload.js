import { useState } from 'react';

const useImageUpload = (maxImages = 4) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (uploadedImages.length >= maxImages) {
      console.warn('Maximum number of images reached');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImages(prevImages => [...prevImages, e.target.result]);
      setImageFiles(prevFiles => [...prevFiles, file]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    setUploadedImages(prevImages => prevImages.filter((_, i) => i !== index));
    setImageFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const addImageFromUrl = async (url) => {
    if (uploadedImages.length >= maxImages) {
      console.warn('Maximum number of images reached');
      return Promise.reject('Maximum number of images reached');
    }

    try {
      // First approach: Try direct fetch with CORS handling
      try {
        const response = await fetch(url, { 
          mode: 'cors',
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
        
        if (!response.ok) throw new Error('Direct fetch failed');
        
        const blob = await response.blob();
        const file = new File([blob], `image-${Date.now()}.jpg`, { type: blob.type });
        
        // Create object URL for display
        const objectUrl = URL.createObjectURL(blob);
        
        setUploadedImages(prevImages => [...prevImages, objectUrl]);
        setImageFiles(prevFiles => [...prevFiles, file]);
        
        return objectUrl;
      } catch (directFetchError) {
        console.warn('Direct fetch failed, trying alternative method:', directFetchError);
        
        // Second approach: Use a proxy or a data URL approach
        // For this example, we'll just add the URL directly if it looks like a valid image URL
        // In production, you should use a proxy server or backend endpoint
        
        // Check if URL has a common image extension
        const isLikelyImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
        
        if (isLikelyImage) {
          // Create a placeholder file for backend submission
          // The actual file will be downloaded on the server side
          const filename = url.split('/').pop() || `image-${Date.now()}.jpg`;
          const placeholderBlob = new Blob(['placeholder'], { type: 'text/plain' });
          const placeholderFile = new File([placeholderBlob], filename, { 
            type: 'application/octet-stream',
            lastModified: new Date().getTime()
          });

          // Add URL as a custom property to the file for server-side processing
          placeholderFile.sourceUrl = url;
          
          setUploadedImages(prevImages => [...prevImages, url]);
          setImageFiles(prevFiles => [...prevFiles, placeholderFile]);
          
          return url;
        } else {
          throw new Error('URL does not appear to be a valid image');
        }
      }
    } catch (error) {
      console.error('Error adding image from URL:', error);
      throw error;
    }
  };

  const clearImages = () => {
    // Release any object URLs to avoid memory leaks
    uploadedImages.forEach(img => {
      if (img.startsWith('blob:')) {
        URL.revokeObjectURL(img);
      }
    });
    setUploadedImages([]);
    setImageFiles([]);
  };

  return {
    uploadedImages,
    imageFiles,
    handleImageUpload,
    removeImage,
    addImageFromUrl,
    clearImages,
    maxImagesReached: uploadedImages.length >= maxImages
  };
};

export default useImageUpload;
