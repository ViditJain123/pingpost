import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const SubscriptionCard = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Pricing variables
  const monthlyPrice = 800;
  const yearlyPrice = 700;
  const yearlyTotal = yearlyPrice * 12;
  const savingsPercentage = Math.round((1 - (yearlyPrice / monthlyPrice)) * 100);

  const handleSubscription = async (planType) => {
    try {
      setIsLoading(true);
      
      if (planType === 'free') {
        // Handle free subscription (you might want to update the user model)
        alert('You have selected the free plan');
        router.push('/dashboard');
        return;
      }

      const response = await fetch('/api/subscription/createSubscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: isYearly ? 'yearly' : 'monthly',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create subscription');
      }

      // Redirect to Cashfree payment page
      window.location.href = data.subscriptionLink;
      
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to subscribe: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-5">
      <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">Choose Your Plan</h2>
      
      {/* Billing Toggle */}
      <div className="flex justify-center items-center mb-8">
        <span className={`mr-3 ${!isYearly ? 'font-bold text-indigo-600' : 'text-gray-500'}`}>
          Monthly
        </span>
        <div 
          onClick={() => setIsYearly(!isYearly)}
          className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer ${isYearly ? 'bg-indigo-600' : 'bg-gray-300'}`}
        >
          <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isYearly ? 'translate-x-7' : ''}`}></div>
        </div>
        <span className={`ml-3 ${isYearly ? 'font-bold text-indigo-600' : 'text-gray-500'}`}>
          Yearly <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full ml-1">Save {savingsPercentage}%</span>
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {/* Free Subscription Card */}
        <div className="w-full max-w-sm bg-white rounded-lg shadow-md hover:shadow-xl transition-transform hover:-translate-y-1 overflow-hidden">
          <div className="px-6 py-8 text-center border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800">Free</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">₹0</span>
              <span className="text-gray-500 text-sm">/month</span>
            </div>
          </div>
          <div className="p-6">
            <ul className="mb-8 space-y-4">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Content Calendar
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Drag & Drop Scheduling
              </li>
            </ul>
            <button 
              onClick={() => handleSubscription('free')}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition-colors disabled:opacity-70">
              {isLoading ? 'Processing...' : 'Get Started'}
            </button>
          </div>
        </div>

        {/* Premium Subscription Card */}
        <div className="w-full max-w-sm bg-white rounded-lg shadow-md hover:shadow-xl transition-transform hover:-translate-y-1 overflow-hidden border-2 border-indigo-600 relative">
          <div className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            Most Popular
          </div>
          <div className="px-6 py-8 text-center border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800">Premium</h3>
            <div className="mt-4">
              {isYearly ? (
                <>
                  <div className="flex flex-col">
                    <div className="text-4xl font-bold text-gray-900">₹{yearlyPrice}</div>
                    <div className="text-gray-500 text-sm mb-2">/month, billed annually</div>
                    <div className="text-lg font-semibold text-indigo-600">₹{yearlyTotal} per year</div>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold text-gray-900">₹{monthlyPrice}</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </>
              )}
            </div>
          </div>
          <div className="p-6">
            <ul className="mb-8 space-y-4">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">All features in free</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                AI Writing & Trending Topics
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Content Calendar
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Post From Articles
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Post From YouTube Video
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Voice to Post
              </li>
            </ul>
            <button 
              onClick={() => handleSubscription('premium')}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-colors disabled:opacity-70">
              {isLoading ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCard;
