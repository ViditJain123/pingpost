import React from 'react';

const ImageUploadSection = ({ uploadedImages, handleImageUpload, removeImage, maxImagesReached }) => {
  const ImageUploadButton = () => (
    <label className="aspect-square flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200">
      <div className="flex flex-col items-center justify-center">
        <svg className="w-8 h-8 mb-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <p className="text-sm text-gray-500">Add image</p>
      </div>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
        multiple // Allow selecting multiple files
      />
    </label>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Add up to 4 images:</p>
      <div className="grid grid-cols-4 gap-3">
        {uploadedImages.map((img, index) => (
          <div key={index} className="relative aspect-square group">
            <img
              src={img}
              alt={`Upload ${index + 1}`}
              className="w-full h-full object-cover rounded-lg shadow-sm"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-gray-200 text-black p-1.5 rounded-full hover:bg-gray-300 transition-colors opacity-90 hover:opacity-100 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {!maxImagesReached && <ImageUploadButton />}
      </div>
    </div>
  );
};

export default ImageUploadSection;
