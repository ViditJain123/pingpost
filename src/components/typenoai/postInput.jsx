"use client"

import React, { useState, useEffect, useRef } from 'react';

const PostInput = ({ onContentChange }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);
  
  // Update content and notify parent
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-7 w-full h-full border border-gray-100">
      <textarea
        ref={textareaRef}
        className="w-full h-full flex-1 p-5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-gray-700 font-normal"
        placeholder="Start writing your post here..."
        style={{ minHeight: "calc(100% - 14px)" }}
        value={content}
        onChange={handleContentChange}
      />
    </div>
  );
};

export default PostInput;