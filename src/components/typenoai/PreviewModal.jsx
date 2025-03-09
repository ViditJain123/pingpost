import React, { useState, useEffect, useRef } from 'react';

const PreviewModal = ({ isOpen, onClose, postContent, postTitle, postImages }) => {
  const [activeDevice, setActiveDevice] = useState('phone');
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const deviceRef = useRef(null);

  // Adjust scale based on container and device size
  useEffect(() => { 
    if (isOpen && containerRef.current && deviceRef.current) {
      const calculateScale = () => {
        const containerHeight = containerRef.current.clientHeight;
        const deviceHeight = deviceRef.current.scrollHeight;
        
        // Leave some padding (0.9) to ensure it's not too tight
        const newScale = Math.min(1, (containerHeight * 0.9) / deviceHeight);
        setScale(newScale);
      };
      
      calculateScale();
      // Recalculate on window resize
      window.addEventListener('resize', calculateScale);
      
      return () => {
        window.removeEventListener('resize', calculateScale);
      };
    }
  }, [isOpen, activeDevice]);

  if (!isOpen) return null;

  // LinkedIn post template for different devices
  const renderLinkedInPost = () => {
    // Device-specific classes for text sizing
    const titleClasses = {
      phone: "p-3 pb-1 font-bold text-xs", // 12px
      tablet: "p-3 pb-1 font-bold text-sm", // 14px
      laptop: "p-3 pb-1 font-bold text-lg" // ~1.125rem
    };
    
    const contentClasses = {
      phone: "p-3 text-gray-800 whitespace-pre-wrap text-[11.5px] leading-tight", 
      tablet: "p-3 text-gray-800 whitespace-pre-wrap text-[11.5px] leading-normal",
      laptop: "p-3 text-gray-800 whitespace-pre-wrap text-[11.5px] leading-relaxed"
    };
    
    const buttonTextClasses = {
      phone: "text-[8px]", // Exactly 8px
      tablet: "text-[8px]", // Exactly 8px
      laptop: "text-sm" // ~0.875rem
    };
    
    const statsClasses = {
      phone: "text-[8px]", // Exactly 8px 
      tablet: "text-[8px]", // Exactly 8px
      laptop: "text-xs" // ~0.75rem
    };

    return (
      <div className="bg-white rounded-lg shadow w-full">
        <div className="p-3 border-b">
          <div className="flex items-center space-x-2">
            <div className={`${activeDevice === 'phone' ? 'w-8 h-8' : 'w-12 h-12'} rounded-full bg-gray-200`}></div>
            <div>
              <p className={`font-semibold text-gray-800 ${activeDevice === 'phone' ? 'text-[10px]' : activeDevice === 'tablet' ? 'text-xs' : 'text-base'}`}>Your Name</p>
              <p className={`text-gray-500 ${activeDevice === 'phone' || activeDevice === 'tablet' ? 'text-[8px]' : 'text-xs'}`}>Your Title • 1h</p>
            </div>
          </div>
        </div>
        
        {postTitle && (
          <div className={titleClasses[activeDevice]}>
            {postTitle}
          </div>
        )}
        
        <div className={contentClasses[activeDevice]}>
          {postContent || "No content to preview"}
        </div>
        
        {postImages && postImages.length > 0 && (
          <div className={`grid ${postImages.length === 1 ? '' : 'grid-cols-2 gap-1'}`}>
            {postImages.map((img, index) => (
              <div key={index} className={`${postImages.length === 1 ? 'w-full' : ''} aspect-square`}>
                <img 
                  src={img} 
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="p-3 border-t">
          <div className="flex justify-between text-gray-500">
            <div className="flex items-center space-x-1">
              <svg className={`${activeDevice === 'phone' ? 'w-3 h-3' : 'w-4 h-4'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 18.5c-3.5 0-6.5-1.5-8-4 1.5-2.5 4.5-4 8-4s6.5 1.5 8 4c-1.5 2.5-4.5 4-8 4z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span className={statsClasses[activeDevice]}>150</span>
            </div>
            <div className={statsClasses[activeDevice]}>25 comments • 10 reposts</div>
          </div>
          
          <div className="flex justify-between mt-2 pt-1 border-t">
            <button className={`flex items-center space-x-1 text-gray-500 hover:bg-gray-100 ${activeDevice === 'phone' ? 'px-1 py-0.5' : 'px-2 py-1'} rounded`}>
              <svg className={`${activeDevice === 'phone' ? 'w-3 h-3' : activeDevice === 'tablet' ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.865-1.271L7.5 15H5.231a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.732 4h4.017a2 2 0 011.865 1.271L16.5 9"></path>
              </svg>
              <span className={buttonTextClasses[activeDevice]}>Like</span>
            </button>
            <button className={`flex items-center space-x-1 text-gray-500 hover:bg-gray-100 ${activeDevice === 'phone' ? 'px-1 py-0.5' : 'px-2 py-1'} rounded`}>
              <svg className={`${activeDevice === 'phone' ? 'w-3 h-3' : activeDevice === 'tablet' ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
              </svg>
              <span className={buttonTextClasses[activeDevice]}>Comment</span>
            </button>
            <button className={`flex items-center space-x-1 text-gray-500 hover:bg-gray-100 ${activeDevice === 'phone' ? 'px-1 py-0.5' : 'px-2 py-1'} rounded`}>
              <svg className={`${activeDevice === 'phone' ? 'w-3 h-3' : activeDevice === 'tablet' ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
              <span className={buttonTextClasses[activeDevice]}>Repost</span>
            </button>
            <button className={`flex items-center space-x-1 text-gray-500 hover:bg-gray-100 ${activeDevice === 'phone' ? 'px-1 py-0.5' : 'px-2 py-1'} rounded`}>
              <svg className={`${activeDevice === 'phone' ? 'w-3 h-3' : activeDevice === 'tablet' ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span className={buttonTextClasses[activeDevice]}>Send</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gray-100 rounded-xl shadow-2xl w-4/5 h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-xl text-gray-800">Preview</h2>
          <div className="flex gap-4 items-center">
            {/* Device buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setActiveDevice('phone')} 
                className={`p-2 rounded-lg ${activeDevice === 'phone' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                title="Phone view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
              <button 
                onClick={() => setActiveDevice('tablet')} 
                className={`p-2 rounded-lg ${activeDevice === 'tablet' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                title="Tablet view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
              <button 
                onClick={() => setActiveDevice('laptop')} 
                className={`p-2 rounded-lg ${activeDevice === 'laptop' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                title="Laptop view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Preview content - no overflow on this container */}
        <div 
          ref={containerRef}
          className="flex-1 p-6 flex items-center justify-center overflow-hidden"
        >
          {/* Device container with scaling */}
          <div 
            ref={deviceRef}
            className="transition-all duration-300"
            style={{ transform: `scale(${scale})` }}
          >
            {activeDevice === 'phone' && (
              <div className="border-8 border-gray-800 rounded-[36px] h-[600px] w-[300px] relative shadow-xl overflow-hidden">
                <div className="absolute top-0 w-[120px] h-[25px] bg-gray-800 left-1/2 -translate-x-1/2 rounded-b-[14px] z-10"></div>
                <div className="h-full w-full bg-gray-100 overflow-y-auto pt-6 rounded-[28px]">
                  <div className="bg-white w-full border-b border-gray-200">
                    <div className="flex items-center p-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">in</div>
                      <div className="flex-1 px-2">
                        <input type="text" placeholder="Search" className="bg-gray-100 rounded-full text-sm p-1 px-3 w-full" />
                      </div>
                      <div className="w-6 h-6">
                        <svg className="w-full h-full text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    {renderLinkedInPost()}
                  </div>
                </div>
              </div>
            )}

            {activeDevice === 'tablet' && (
              <div className="border-[12px] border-gray-800 rounded-[24px] h-[600px] w-[450px] relative shadow-xl overflow-hidden">
                <div className="absolute top-0 w-[60px] h-[6px] bg-gray-700 left-1/2 -translate-x-1/2 rounded-full mt-1.5 z-10"></div>
                <div className="h-full w-full bg-gray-100 overflow-y-auto rounded-[16px]">
                  <div className="bg-white w-full flex items-center p-2 border-b border-gray-200 sticky top-0 z-10">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm mr-3">in</div>
                    <div className="flex-1">
                      <input type="text" placeholder="Search" className="bg-gray-100 rounded-full text-sm p-2 px-4 w-full" />
                    </div>
                    <div className="flex ml-3 space-x-4">
                      <div className="w-6 h-6">
                        <svg className="w-full h-full text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div className="w-6 h-6">
                        <svg className="w-full h-full text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    {renderLinkedInPost()}
                  </div>
                </div>
              </div>
            )}

            {activeDevice === 'laptop' && (
              <div className="border-[14px] border-gray-800 rounded-t-xl h-[500px] w-[700px] relative shadow-2xl">
                <div className="absolute top-0 w-full h-5 bg-gray-700"></div>
                <div className="absolute top-0 w-2 h-2 bg-red-500 rounded-full ml-2 mt-1.5"></div>
                <div className="absolute top-0 w-2 h-2 bg-yellow-500 rounded-full ml-5 mt-1.5"></div>
                <div className="absolute top-0 w-2 h-2 bg-green-500 rounded-full ml-8 mt-1.5"></div>
                
                <div className="h-full w-full bg-gray-100 overflow-y-auto pt-5">
                  <div className="bg-white w-full border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-screen-lg mx-auto flex items-center p-2.5">
                      <div className="w-9 h-9 rounded-sm bg-blue-600 flex items-center justify-center text-white font-bold text-2xl mr-2.5">in</div>
                      <div className="w-80 mr-auto">
                        <input type="text" placeholder="Search" className="bg-gray-100 rounded-md text-sm p-2 px-4 w-full" />
                      </div>
                      <div className="flex space-x-6">
                        <div className="flex flex-col items-center text-gray-500 hover:text-black">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="text-xs">Home</span>
                        </div>
                        <div className="flex flex-col items-center text-gray-500 hover:text-black">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="text-xs">Network</span>
                        </div>
                        <div className="flex flex-col items-center text-gray-500 hover:text-black">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs">Jobs</span>
                        </div>
                        <div className="flex flex-col items-center text-gray-500 hover:text-black">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <span className="text-xs">Messaging</span>
                        </div>
                        <div className="flex flex-col items-center text-gray-500 hover:text-black">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <span className="text-xs">Notifications</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-w-screen-md mx-auto grid grid-cols-7 gap-6 p-4">
                    <div className="hidden md:block col-span-2">
                      <div className="bg-white rounded-lg shadow p-3">
                        <div className="bg-blue-100 h-16 rounded-t-lg"></div>
                        <div className="flex flex-col items-center -mt-8">
                          <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-white"></div>
                          <h3 className="font-medium mt-2">Your Name</h3>
                          <p className="text-xs text-gray-500">Your Title</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-7 md:col-span-5">
                      {renderLinkedInPost()}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 h-4 w-full rounded-b-lg"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
