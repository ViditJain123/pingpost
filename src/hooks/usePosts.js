import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    console.log("Refetching posts...");
    setLoading(true);
    setRefetchTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const response = await axios.get('/api/posts/getPosts');
        
        // Extract data directly from axios response
        const data = response.data;
        
        if (data.success && Array.isArray(data.posts)) {
          // Transform posts to match the expected card format
          const formattedPosts = data.posts.map(post => ({
            id: post._id,
            title: post.title || 'Untitled Post',
            description: post.postContent || post.content || 'No description provided',
            status: post.postStatus || 'draft',
            scheduleTime: post.scheduleTime || null,
            content: post.postContent || post.content
          }));
          
          setPosts(formattedPosts);
        } else {
          throw new Error('Failed to fetch posts or invalid data format');
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [refetchTrigger]); // Add refetchTrigger as a dependency

  return { posts, loading, error, isAuthenticated, refetch };
}
