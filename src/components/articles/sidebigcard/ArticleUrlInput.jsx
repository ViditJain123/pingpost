import React from 'react';

const ArticleUrlInput = ({ articleUrl, setArticleUrl, isGenerating, errorMessage }) => {
  return (
    <div className="mb-2">
      <div className="relative">
        <input
          type="url"
          id="articleUrl"
          className="block w-full rounded-md border border-gray-300 px-3.5 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Paste the article URL here"
          value={articleUrl}
          onChange={(e) => setArticleUrl(e.target.value)}
          disabled={isGenerating}
          required
        />
      </div>
    </div>
  );
};

export default ArticleUrlInput;
