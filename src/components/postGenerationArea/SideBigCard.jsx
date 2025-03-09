import React from 'react';

const SideBigCard = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      <h2 className="text-2xl font-bold mb-4">Write your post</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Title"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default SideBigCard;
