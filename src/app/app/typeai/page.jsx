import React from 'react'
import SideBigCard from '@/components/typenoai/SideBigCard'
import PostInput from '@/components/typenoai/postInput'

function page() {
  return (
    <div className="flex gap-4 p-4 ml-20 mt-16 h-[calc(100vh-5rem)]">
      <div className="w-1/3">
        <SideBigCard />
      </div>
      <div className="w-2/3 flex flex-col">
        <PostInput />
      </div>
    </div>
  )
}

export default page