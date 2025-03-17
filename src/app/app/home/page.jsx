'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/home/Card';
import Calendar from '@/components/home/Calender';
import SearchBar from '@/components/home/SearchBar';
import { usePosts } from '@/hooks/usePosts';

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [cardOffsets, setCardOffsets] = useState({});
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { posts: cardData, loading, error, isAuthenticated, refetch } = usePosts();
  const [schedulingStatus, setSchedulingStatus] = useState({ loading: false, error: null, success: false });

  // Initialize calendar with scheduled and published posts
  useEffect(() => {
    if (cardData.length > 0) {
      const calendarTasks = cardData
        .filter(post => post.status === 'scheduled' || post.status === 'published')
        .map(post => {
          const scheduleDate = new Date(post.scheduleTime);
          const dateStr = scheduleDate.toISOString().split('T')[0];
          
          return {
            id: post.id,
            title: post.title,
            date: dateStr,
            scheduleTime: post.scheduleTime,
            status: post.status
          };
        });
      
      setTasks(calendarTasks);
    }
  }, [cardData]);

  // Filter out cards that are already assigned to calendar or published
  const availableCards = cardData.filter(
    card => !tasks.some(task => task.id === card.id) && card.status === 'draft'
  );

  const filteredCards = availableCards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTaskAdd = (task) => {
    setTasks(prev => [...prev, task]);
  };

  const handleTaskRemove = (taskId) => {
    // Find the task to check its status
    const taskToRemove = tasks.find(task => task.id === taskId);
    
    if (taskToRemove && taskToRemove.status === 'scheduled') {
      // For scheduled posts, update status to draft
      cancelScheduledPost(taskId);
    } else if (taskToRemove && taskToRemove.status !== 'published') {
      // Only remove if it's not published
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const cancelScheduledPost = async (postId) => {
    try {
      const response = await fetch('/api/posts/cancelScheduledPost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel scheduled post');
      }
      
      console.log(`Successfully cancelled scheduled post: ${postId}`);
      
      // Remove the task from the calendar
      setTasks(prev => prev.filter(task => task.id !== postId));
      
      // Update our local state first
      setTimeout(() => {
        // Use the refetch function to refresh the posts
        if (typeof refetch === 'function') {
          refetch();
        } else {
          console.error('refetch is not a function', refetch);
          // Alternative approach if refetch isn't working
          window.location.reload();
        }
      }, 500);
      
    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
      alert('Failed to cancel scheduled post: ' + error.message);
    }
  };

  const handleCardHeightChange = useCallback((index, extraHeight) => {
    setCardOffsets(prev => {
      if (prev[index] === extraHeight) return prev;
      const newOffsets = { ...prev };
      for (let i = index + 1; i < cardData.length; i++) {
        newOffsets[i] = extraHeight;
      }
      return newOffsets;
    });
  }, [cardData.length]);
  const scheduleSelectedPosts = async () => {
    setSchedulingStatus({ loading: true, error: null, success: false });
    
    try {
      const results = [];
      console.log(`Attempting to schedule ${tasks.length} posts...`);
      
      // Only schedule posts that aren't already scheduled or published
      const postsToSchedule = tasks.filter(task => 
        !task.status || task.status === 'draft'
      );
        
      for (const task of postsToSchedule) {
        const post = cardData.find(card => card.id === task.id);
        
        if (!post) {
          console.error(`Post with ID ${task.id} not found`);
          continue;
        }
        
        // Create formatted date for the API
        const scheduleTimeDate = new Date(task.scheduleTime);
        console.log(`Scheduling post "${post.title}" for ${scheduleTimeDate.toISOString()}`);
        
        // Call the API to schedule the post
        const response = await fetch('/api/posts/schedulePost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: post.id,
            content: post.content || post.description,
            title: post.title,
            scheduleTime: scheduleTimeDate.toISOString(),
          }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to schedule post');
        }
        
        console.log(`Successfully scheduled post: ${result.postId}`);
        
        // Update the task status in the tasks array
        setTasks(prev => prev.map(task => 
          task.id === post.id
            ? { ...task, status: 'scheduled' }
            : task
        ));
          
        results.push(result);
      }
        setIsModalOpen(false);  
      console.log(`All posts scheduled successfully: ${results.length} posts`);
      setSchedulingStatus({ loading: false, error: null, success: true });
      
      setTimeout(() => {
        setIsModalOpen(false);
        setSchedulingStatus({ loading: false, error: null, success: false });
      }, 2000);
      
    } catch (error) {
      console.error('Error scheduling posts:', error);
      setSchedulingStatus({ 
        loading: false, 
        error: error.message || 'Failed to schedule posts',
        success: false
      });
    }
  };
return (
  <div className="min-h-screen bg-[#F9F9F9]">
    <div className="relative h-screen bg-[#F9F9F9] overflow-hidden flex flex-col md:flex-row pl-16">
      <section className="w-full md:w-[369px] mt-[100px] mx-4 md:ml-10 mb-10 h-[calc(100vh-140px)] bg-white rounded-[14.01px] p-4 flex flex-col shadow-md min-w-0">
        {/* Scrollable cards container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Loading posts...</p>
            </div>
          ) : error ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-red-500">Error loading posts: {error}</p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No posts found</p>
              </div>
            ) : (
              filteredCards.map((card, index) => (
                <div
                  key={card.id}
                  style={{
                    transform: `translateY(${cardOffsets[index] || 0}px)`,
                    transition: 'transform 200ms ease-in-out'
                  }}
                >
                  <Card
                    key={card.id}
                    title={card.title}
                    description={card.description}
                    searchTerm={searchTerm}
                    index={index}
                    onHeightChange={handleCardHeightChange}
                    id={card.id}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right section with Calendar */}
        <section className="flex-1 mt-[100px] mx-4 md:mx-10 mb-10 h-[calc(100vh-140px)]">
          <div className="w-full h-full bg-white rounded-[14.01px] p-6 shadow-lg relative">
            <Calendar
              year={new Date().getFullYear()}
              month={new Date().getMonth()}
              tasks={tasks}
              onTaskAdd={handleTaskAdd}
              onTaskRemove={handleTaskRemove}
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute bottom-6 right-6 px-8 py-2.5 rounded-lg bg-gradient-to-r from-[#4776E6] to-[#8E54E9] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Schedule
            </button>
          </div>
        </section>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Confirm Scheduling</h3>
            
            {schedulingStatus.success ? (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
                Posts scheduled successfully!
              </div>
            ) : (
              <>
                <p className="mb-4">Are you sure you want to schedule these {tasks.length} posts?</p>
                <p className="text-gray-600 text-sm mb-6 p-4 bg-gray-50 rounded-lg">
                  Note: Posts will be published at the scheduled times based on your preferences.
                </p>
              </>
            )}
            
            {schedulingStatus.error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
                Error: {schedulingStatus.error}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={schedulingStatus.loading}
              >
                Cancel
              </button>
              <button
                onClick={scheduleSelectedPosts}
                disabled={schedulingStatus.loading || schedulingStatus.success}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#4776E6] to-[#8E54E9] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {schedulingStatus.loading ? 'Scheduling...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}