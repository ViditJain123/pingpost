import { useState, useEffect } from 'react';

const useGetSelectedTitles = () => {
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSelectedTitles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/posts/massSchedular/getSelectedTitles');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch selected titles');
      }
      setTitles(data.titles || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching selected titles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedTitles();
  }, []);

  return { 
    titles, 
    loading, 
    error, 
    refetch: fetchSelectedTitles 
  };
};

export default useGetSelectedTitles;
