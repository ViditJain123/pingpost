import { useState, useEffect } from 'react';
import axios from 'axios';

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

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
            description: post.content || 'No description provided'
          }));
          
          setPosts(formattedPosts);
        } else {
          throw new Error('Failed to fetch posts or invalid data format');
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return { posts, loading, error, isAuthenticated };
}
