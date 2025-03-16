import React from 'react';
import Highlight from './Highlight';

const Card = ({ title, searchTerm, id, postId }) => {
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
      <div className="w-[340px] bg-[#FAE2EC] rounded-[6.15px] p-3 h-16 flex items-center transition-all hover:shadow-md cursor-grab active:cursor-grabbing">
        <h3 className="m-0 text-base text-black font-bold line-clamp-1">
          <Highlight text={title} highlight={searchTerm} />
        </h3>
      </div>
    </div>
  );
};

export default Card;
