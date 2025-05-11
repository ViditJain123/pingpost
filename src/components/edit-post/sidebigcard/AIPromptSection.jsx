import React from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { LuTextCursorInput } from 'react-icons/lu';
import { RiMagicLine } from 'react-icons/ri';
import { RiMagicStickLine } from 'react-icons/ri';

const AIPromptSection = ({
  aiModificationText,
  setAiModificationText,
  isFirstGeneration,
  isGenerating,
  isRecording,
  isProcessing,
  recordingDuration,
  showMaxDurationAlert,
  toggleRecording,
  handleGenerateButtonClick,
  handleModifyButtonClick,
  remainingModifications,
  showExtraCreditsMessage,
  isEditing = false
}) => {
  return (
    <div className="mt-2">
      <div className="flex items-center mb-2">
        <LuTextCursorInput className="text-gray-500 mr-2" />
        <p className="text-gray-700 font-medium">Tell AI what to include</p>
      </div>
      
      <div className="relative">
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 resize-none"
          rows="4"
          placeholder="Describe what you want the AI to write about..."
          value={aiModificationText}
          onChange={(e) => setAiModificationText(e.target.value)}
          disabled={isGenerating || isRecording}
        ></textarea>
        
        <button
          className={`absolute bottom-3 right-3 text-blue-600 hover:text-blue-800 transition-all ${
            isRecording || isProcessing ? 'text-red-500 hover:text-red-700' : ''
          }`}
          onClick={toggleRecording}
          disabled={isGenerating}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording || isProcessing ? (
            <FaMicrophoneSlash size={20} />
          ) : (
            <FaMicrophone size={20} />
          )}
        </button>
      </div>
      
      {isRecording && (
        <div className="text-sm text-red-500 animate-pulse mt-1">
          Recording... {recordingDuration}s
        </div>
      )}
      
      {isProcessing && (
        <div className="text-sm text-blue-500 mt-1 flex items-center">
          <div className="spinner mr-1"></div>
          Processing audio...
        </div>
      )}

      {showMaxDurationAlert && (
        <div className="text-sm text-red-500 mt-1">
          Maximum recording duration reached (60 seconds).
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex space-x-2">
          {/* Generate button */}
          <button
            onClick={handleGenerateButtonClick}
            disabled={isGenerating || !aiModificationText.trim() || isRecording || isProcessing}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition ${
              isGenerating || !aiModificationText.trim() || isRecording || isProcessing
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="loading-dots mr-1"></span>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <RiMagicLine className="mr-2" />
                Generate
              </>
            )}
          </button>
          
          {/* Modify button - only show on edit pages */}
          {isEditing && (
            <button
              onClick={handleModifyButtonClick}
              disabled={isGenerating || isRecording || isProcessing}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition ${
                isGenerating || isRecording || isProcessing
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isGenerating ? (
                <><span className="loading-dots mr-1"></span><span>Updating...</span></>
              ) : (
                <>Save Changes</>
              )}
            </button>
          )}
        </div>
        
        {!isFirstGeneration && (
          <div className="text-sm text-gray-500">
            {showExtraCreditsMessage ? (
              <span className="text-orange-500">Using extra credits</span>
            ) : (
              `${remainingModifications} free ${
                remainingModifications === 1 ? 'modification' : 'modifications'
              } left`
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPromptSection;
