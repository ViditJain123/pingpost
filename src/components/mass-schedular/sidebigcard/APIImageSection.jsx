import React from 'react';

const APIImageSection = ({ apiImageUrls, handleSelectAPIImage }) => {
  if (apiImageUrls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Generated images - click to add to your post:</p>
      <div className="grid grid-cols-4 gap-3">
        {apiImageUrls.map((imageUrl, index) => (
          <div 
            key={`api-image-${index}`} 
            className="relative aspect-square cursor-pointer group"
            onClick={() => handleSelectAPIImage(imageUrl)}
          >
            <img
              src={imageUrl}
              alt={`Generated ${index + 1}`}
              className="w-full h-full object-cover rounded-lg shadow-sm hover:opacity-80 transition-opacity duration-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 flex items-center justify-center rounded-lg transition-all duration-200">
              <div className="opacity-0 group-hover:opacity-100 bg-blue-500 text-white rounded-full p-2 transform scale-0 group-hover:scale-100 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 italic">You can select multiple images from the generated options</p>
    </div>
  );
};

export default APIImageSection;
