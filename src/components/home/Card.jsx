import React, { useState } from 'react';
import Highlight from './Highlight';
import { useRouter } from 'next/navigation';

const Card = ({ title, searchTerm, id, postId, onPostDeleted, onDeleteClick }) => {
  const router = useRouter();
  
  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent triggering drag events
    const postIdToUse = postId || id; 
    router.push(`/app/home/edit-post/${postIdToUse}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent triggering drag events
    // Send the post ID to be deleted to the parent component
    onDeleteClick(postId || id, title);
  };
  
  return (
    <div 
      className="h-16"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ 
          id, 
          title, 
          postId: postId || id // Use the actual post ID if available
        }));
        e.currentTarget.classList.add('opacity-50');
        e.currentTarget.style.cursor = 'grabbing';
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('opacity-50');
        e.currentTarget.style.cursor = 'grab';
      }}
    >
      <div className="w-[340px] bg-[#FAE2EC] rounded-[6.15px] p-3 h-16 flex items-center justify-between transition-all hover:shadow-md cursor-grab active:cursor-grabbing">
        <h3 className="m-0 text-base text-black font-bold line-clamp-1 flex-1">
          <Highlight text={title} highlight={searchTerm} />
        </h3>
        <div className="flex ml-2">
          <button 
            onClick={handleEdit}
            className="p-1.5 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 transition-all mr-1"
            title="Edit post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button 
            onClick={handleDeleteClick}
            className="p-1.5 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100 hover:bg-red-100 transition-all"
            title="Delete post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 hover:text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card;
