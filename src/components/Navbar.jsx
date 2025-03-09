'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <>
      <nav className="bg-white z-50 fixed w-full top-0">
        <div className="w-full px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center pl-[196px]">
              <Link href="/">
                <Image
                  src="/images/logo/Logo 2.svg"
                  alt="Pingpost Logo"
                  width={146}
                  height={41}
                  priority
                />
              </Link>
            </div>
          </div>
        </div>
        {/* Gradient Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-[#CB2972] to-[#4A3D9B]" />
      </nav>
    </>
  );
}
