import React from 'react';
import { RiMagicLine } from 'react-icons/ri';

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
  handleModifyButtonClick,
  remainingModifications,
  showExtraCreditsMessage
}) => {
  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          placeholder={isFirstGeneration 
            ? "Tell me what you want to write about" 
            : "Enter modifications you want to make using AI"
          }
          className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 min-h-[100px] resize-y"
          value={aiModificationText}
          onChange={(e) => setAiModificationText(e.target.value)}
          disabled={isGenerating}
        />
        <div className="absolute top-3 right-3 flex items-center">
          {isRecording && (
            <span className="mr-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </span>
          )}
          <button
            onClick={toggleRecording}
            disabled={isProcessing || isGenerating}
            className={`p-2 rounded-full transition-all duration-300 ${
              isProcessing 
                ? 'bg-blue-100 text-blue-600 cursor-wait' 
                : isRecording 
                ? 'bg-red-100 text-red-600 animate-pulse' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={
              isProcessing 
                ? "Processing audio..." 
                : isRecording 
                ? "Stop recording" 
                : "Start voice input"
            }
          >
            {isProcessing ? (
              <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isRecording ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 8H16V16H8V8Z" fill="currentColor" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10V12C19 15.866 15.866 19 12 19M12 19C8.13401 19 5 15.866 5 12V10M12 19V22M8 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {showMaxDurationAlert && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm flex items-start animate-fadeIn">
          <svg className="w-5 h-5 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Recording reached maximum duration of 2 minutes and was automatically stopped.</span>
        </div>
      )}
      
      <button 
        onClick={handleModifyButtonClick}
        disabled={isGenerating || isRecording || isProcessing}
        className={`w-full p-3 ${
          isGenerating || isRecording || isProcessing
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
        } font-medium rounded-lg flex items-center justify-center transition-all duration-200`}
      >
        {false && isGenerating ? ( /* Disabled local loading indicator */
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : isFirstGeneration ? (
          <>
            <RiMagicLine className="w-5 h-5 mr-2" />
            Generate
          </>
        ) : (
          <>
            <svg 
              className="w-5 h-5 mr-2" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M8 9L11.5 5.5M16 4L15 8L19 12L15 16L16 20L12 19L8 20L9 16L5 12L9 8L8 4L12 5L16 4Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            Modify ({remainingModifications}/4)
          </>
        )}
      </button>

      {showExtraCreditsMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 shadow-sm">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 11-2 0 1 1 012 0zM9 9a1 1 000 2v3a1 1 001 1h1a1 1 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            <span>You've used all your free modifications. Additional modifications will cost extra credits.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPromptSection;
