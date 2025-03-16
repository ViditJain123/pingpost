import React from 'react';

const TitleInput = ({ title, setTitle, isGenerating, errorMessage }) => {
  return (
    <>
      <input
        type="text"
        placeholder="Title"
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 font-medium"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isGenerating}
      />
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative animate-fadeIn" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
    </>
  );
};

export default TitleInput;
