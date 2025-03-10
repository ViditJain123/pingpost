import { useState } from 'react';

const useImageUpload = (maxImages = 4) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]); 
  
  const maxImagesReached = uploadedImages.length >= maxImages;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (uploadedImages.length >= maxImages) {
      return;
    }
    
    // Create a local URL for preview
    const imageUrl = URL.createObjectURL(file);
    setUploadedImages(prev => [...prev, imageUrl]);
    
    // Store the file for later upload
    setImageFiles(prev => [...prev, file]);
  };

  const removeImage = (index) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(uploadedImages[index]);
    
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  return {
    uploadedImages,
    imageFiles,
    handleImageUpload,
    removeImage,
    maxImagesReached
  };
};

export default useImageUpload;
