"use client"

import React, { useState, useEffect, useRef } from 'react';

const PostInput = ({ onContentChange, content, isLoading, titleStatus }) => {
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
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-xl">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
            <p className="mt-4 text-gray-700 font-medium">Generating your post...</p>
          </div>
        </div>
      )}
      
      {titleStatus === 'generated' && !isLoading && content && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full z-10">
          Generated Post
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