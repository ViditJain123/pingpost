"use client"

import React from 'react';

const ExternalLinkInput = ({ value, onChange, disabled }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        External Link (Optional)
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste YouTube or article URL here (optional)"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        disabled={disabled}
      />
      <p className="text-xs text-gray-500 mt-1">
        Adding a link will help generate better content based on the source
      </p>
    </div>
  );
};

export default ExternalLinkInput;
