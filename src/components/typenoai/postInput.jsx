"use client"

import React, { useState, useEffect, useRef } from 'react';

const PostInput = ({ onContentChange, content, isLoading }) => {
  const [localContent, setLocalContent] = useState(content || '');
  const textareaRef = useRef(null);
  
  // Update content and notify parent
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
  };
  
  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Update content when it's changed externally
  useEffect(() => {
    console.log("Content prop updated:", content);
    if (content !== undefined && content !== localContent) {
      setLocalContent(content);
      // Also update the textarea value directly to ensure it reflects changes
      if (textareaRef.current) {
        textareaRef.current.value = content;
      }
    }
  }, [content]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-7 w-full h-full border border-gray-100 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center rounded-xl">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-md font-medium text-gray-700">Generating your post...</p>
        </div>
      )}
      <textarea
        ref={textareaRef}
        className="w-full h-full flex-1 p-5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-gray-700 font-normal"
        placeholder="Start writing your post here..."
        style={{ minHeight: "calc(100% - 14px)" }}
        value={localContent}
        onChange={handleContentChange}
        disabled={isLoading}
      />
    </div>
  );
};

export default PostInput;