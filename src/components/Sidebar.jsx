'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2 } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [selected, setSelected] = useState('home');
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    
    // Navigation completed
    setIsLoading(false);
  }, [pathname]);

  // Add safety timeout to prevent infinite loading
  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000); // 5 second timeout as safety
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleNavigation = (iconId, href) => {
    if (pathname !== href) { // Only show loading if navigating to a new page
      setSelected(iconId);
      setIsLoading(true);
    }
  };

  const icons = [
    { id: 'home', path: '/sidebar/home.svg', href: '/app/home', label: 'Content Calender' },
    { id: 'messages', path: '/sidebar/messages.svg', href: '/app/typenoai', label: 'Draft Post' },
    { id: 'massScheduler', path: '/sidebar/mass_schedular.svg', href: '/app/mass-scheduler', label: 'Mass Scheduler' },
    { id: 'profile', path: '/sidebar/profile.svg', href: '/app/profile', label: 'Profile' },
  ];

  return (
    <>
      {/* Loading Overlay - Updated to match mass-scheduler style */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/90 flex flex-col items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      )}
      
      <div className="fixed left-0 top-0 h-full w-16 bg-white shadow-lg flex flex-col items-center justify-center space-y-8 z-40">
        {icons.map((icon) => (
          <div 
            key={icon.id} 
            className="relative w-full flex justify-center"
            onMouseEnter={() => setHoveredIcon(icon.id)}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            {selected === icon.id && (
              <div 
                className="absolute h-full -z-10 left-0"
                style={{
                  width: '40px',
                  background: 'linear-gradient(90deg, #4182F9 0%, rgba(65, 130, 249, 0) 50%)'
                }}
              />
            )}
            
            <Link
              href={icon.href}
              className="relative w-[29px] h-[29px] cursor-pointer block"
              onClick={() => handleNavigation(icon.id, icon.href)}
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
            
            {/* Tooltip that shows on hover */}
            {hoveredIcon === icon.id && (
              <div className="absolute left-16 bg-gray-800 text-white py-1 px-2 rounded text-xs whitespace-nowrap">
                {icon.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
