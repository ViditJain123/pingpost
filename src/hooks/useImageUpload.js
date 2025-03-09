import { useState } from 'react';

const useImageUpload = (maxImages = 4) => {
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/') && uploadedImages.length < maxImages) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedImages([...uploadedImages, imageUrl]);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  return {
    uploadedImages,
    handleImageUpload,
    removeImage,
    maxImagesReached: uploadedImages.length >= maxImages
  };
};

export default useImageUpload;
