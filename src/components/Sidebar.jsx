'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Sidebar() {
  const pathname = usePathname();
  const [selected, setSelected] = useState('home');
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check subscription status
    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/subscription/subscriptionStatus');
        const data = await response.json();
        setHasActiveSubscription(data.hasActiveSubscription);
      } catch (error) {
        console.error("Error checking subscription status:", error);
        setHasActiveSubscription(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, []);

  useEffect(() => {
    // Check for nested routes first
    if (pathname.startsWith('/app/mass-scheduler')) {
      setSelected('massScheduler');
      return;
    }
    
    // For other routes, continue with the original logic
    const path = pathname.split('/').pop();
    const matchingIcon = icons.find(icon => icon.href.includes(`/${path}`));
    if (matchingIcon) {
      setSelected(matchingIcon.id);
    }
  }, [pathname]);

  const icons = [
    { id: 'home', path: '/sidebar/home.svg', href: '/app/home', label: 'Content Calender', requiresSubscription: false },
    { id: 'messages', path: '/sidebar/messages.svg', href: '/app/typenoai', label: 'Draft Post', requiresSubscription: false },
    { id: 'article', path: '/sidebar/article.svg', href: '/app/articles', label: 'Draft post from Article', requiresSubscription: true },
    { id: 'youtube', path: '/sidebar/youtube.svg', href: '/app/youtube', label: 'Draft post from YouTube', requiresSubscription: true },
    { id: 'massScheduler', path: '/sidebar/mass_schedular.svg', href: '/app/mass-scheduler', label: 'Mass Scheduler', requiresSubscription: true },
    { id: 'profile', path: '/sidebar/profile.svg', href: '/app/profile', label: 'Profile', requiresSubscription: false },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-white shadow-lg flex flex-col items-center justify-center space-y-8 z-40">
      {icons.map((icon) => {
        const isDisabled = icon.requiresSubscription && !hasActiveSubscription;
        
        return (
          <div 
            key={icon.id} 
            className="relative w-full flex justify-center"
            onMouseEnter={() => setHoveredIcon(icon.id)}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            {selected === icon.id && !isDisabled && (
              <div 
                className="absolute h-full -z-10 left-0"
                style={{
                  width: '40px',
                  background: 'linear-gradient(90deg, #4182F9 0%, rgba(65, 130, 249, 0) 50%)'
                }}
              />
            )}
            
            {isDisabled ? (
              <div className="relative w-[29px] h-[29px] cursor-not-allowed opacity-50">
                <Image
                  src={icon.path}
                  alt={icon.id}
                  fill
                  className="transition-colors duration-200"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(91%) sepia(0%) saturate(0%) hue-rotate(167deg) brightness(95%) contrast(86%)'
                  }}
                />
              </div>
            ) : (
              <Link
                href={icon.href}
                className="relative w-[29px] h-[29px] cursor-pointer block"
                onClick={() => setSelected(icon.id)}
              >
                <Image
                  src={icon.path}
                  alt={icon.id}
                  fill
                  className="transition-colors duration-200"
                  style={{
                    filter: selected === icon.id 
                      ? 'brightness(0) saturate(100%) invert(40%) sepia(98%) saturate(1785%) hue-rotate(199deg) brightness(99%) contrast(96%)'
                      : 'brightness(0) saturate(100%) invert(91%) sepia(0%) saturate(0%) hue-rotate(167deg) brightness(95%) contrast(86%)'
                  }}
                />
              </Link>
            )}
            
            {/* Tooltip that shows on hover */}
            {hoveredIcon === icon.id && (
              <div className="absolute left-16 bg-gray-800 text-white py-1 px-2 rounded text-xs whitespace-nowrap">
                {isDisabled 
                  ? `${icon.label} (Requires subscription)`
                  : icon.label
                }
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
