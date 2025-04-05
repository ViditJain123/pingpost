"use client";
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function MassScheduler() {
  const router = useRouter();
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [randomCount, setRandomCount] = useState("5");
  const [selectedTitles, setSelectedTitles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkTitleStatus();
  }, []);

  const checkTitleStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts/massSchedular/titleStatus');
      const data = await response.json();

      if (data.success) {
        await getTitles();
      } else {
        await generateTitles();
      }
    } catch (err) {
      console.error("Error checking title status:", err);
      setError("Failed to load titles. Please try again.");
      setLoading(false);
      toast.error("Failed to load titles. Please try again.");
    }
  };

  const getTitles = async () => {
    try {
      const response = await fetch('/api/posts/massSchedular/getTitles');
      const data = await response.json();
      
      if (response.ok) {
        setTitles(data.titles || []);
        const initialSelected = (data.titles || [])
          .filter(title => title.titleStatus === "selected")
          .map(title => title.title);
        setSelectedTitles(initialSelected);
      } else {
        setError("Failed to fetch titles");
        toast.error("Failed to fetch titles");
      }
    } catch (err) {
      console.error("Error fetching titles:", err);
      setError("Failed to fetch titles");
      toast.error("Failed to fetch titles");
    } finally {
      setLoading(false);
    }
  };

  const generateTitles = async () => {
    try {
      setRefreshing(true);
      setLoading(true); // Add this line to show the loading screen
      const response = await fetch('/api/posts/massSchedular/generateTitles');
      const data = await response.json();
      
      if (response.ok) {
        setTitles(data.titles || []);
        setSelectedTitles([]);
        toast.success("Titles refreshed successfully");
      } else {
        setError("Failed to generate titles");
        toast.error("Failed to generate titles");
      }
    } catch (err) {
      console.error("Error generating titles:", err);
      setError("Failed to generate titles");
      toast.error("Failed to generate titles");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTitleSelection = (title) => {
    setSelectedTitles(prev => {
      if (prev.includes(title)) {
        return prev.filter(t => t !== title);
      } else {
        return [...prev, title];
      }
    });
  };

  const handleRandomSelection = () => {
    const count = parseInt(randomCount, 10);
    setSelectedTitles([]);
    const availableTitles = [...titles];
    const selected = [];
    for (let i = 0; i < Math.min(count, availableTitles.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableTitles.length);
      const selectedTitle = availableTitles.splice(randomIndex, 1)[0].title;
      selected.push(selectedTitle);
    }
    setSelectedTitles(selected);
  };  

  const handleUnselectAll = () => {
    setSelectedTitles([]);
  };

  const handleStartGenerating = async () => {
    if (selectedTitles.length === 0) {
      toast.warning("Please select at least one title to continue");
      return;
    }
    
    try {
      setSubmitting(true);
      console.log("Saving selected titles:", selectedTitles);
      const response = await fetch('/api/posts/massSchedular/setTitles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedTitles }),
      });
      
      const data = await response.json();
      console.log("Response from setTitles:", data);
      
      if (data.success) {
        toast.success(`Starting generation with ${selectedTitles.length} selected titles`);
        setTimeout(() => {
          router.push('/app/mass-scheduler/start-generating');
        }, 500);
      } else {
        toast.error(data.message || "Failed to save selected titles");
      }
    } catch (error) {
      console.error("Error saving selected titles:", error);
      toast.error("Failed to save selected titles. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pl-8 pt-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">Loading titles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pl-8 pt-16">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={checkTitleStatus}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pl-8 pt-20 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Mass Post Scheduler</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleRandomSelection} 
            variant="outline" 
            style={{ cursor: 'pointer' }}
          >
            Random Selection
          </Button>
          <Select value={randomCount} onValueChange={setRandomCount}>
            <SelectTrigger className="w-20" style={{ cursor: 'pointer' }}>
              <SelectValue placeholder="Count" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {[...Array(15)].map((_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-6">
            <Button 
              onClick={handleUnselectAll} 
              variant="outline"
              style={{ cursor: 'pointer' }}
            >
              Unselect All
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {selectedTitles.length} of {titles.length} selected
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 overflow-y-auto flex-1 pt-2 pl-2 pr-2">
        {titles.map((titleObj, index) => {
          const title = titleObj.title;
          const isSelected = selectedTitles.includes(title);
          
          return (
            <div 
              key={index} 
              className={`relative p-4 rounded-lg flex items-center gap-3 cursor-pointer 
                transition-all duration-200 ease-in-out border ${isSelected ? "border-transparent" : ""}`}
              onClick={() => handleTitleSelection(title)}
              style={isSelected ? {
                position: 'relative',
                background: 'white',
                padding: isSelected ? 'calc(1rem - 3px)' : 'calc(1rem - 1px)',
                cursor: 'pointer'
              } : {
                cursor: 'pointer'
              }}
            >
              {isSelected && (
                <div 
                  className="absolute inset-0 rounded-lg -z-10" 
                  style={{
                    background: 'linear-gradient(135deg, #da44ff 0%, #8b5cf6 100%)',
                    borderRadius: 'inherit',
                    margin: '-3px',
                    transition: 'all 0.2s ease-in-out'
                  }}
                />
              )}
              <Checkbox 
                checked={isSelected} 
                onCheckedChange={() => handleTitleSelection(title)}
                className={`transition-all duration-200 ${
                  isSelected 
                    ? "ring-1 ring-purple-400" 
                    : ""
                }`}
                style={isSelected ? {
                  borderColor: '#da44ff',
                } : {}}
              />
              <span className="text-sm">{title}</span>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between mt-auto mb-4">
        <Button 
          onClick={generateTitles} 
          disabled={refreshing}
          className={`relative transition-all duration-200 ${refreshing ? 'opacity-60' : ''}`}
          style={{
            borderRadius: '12px',
            position: 'relative',
            padding: '0.5rem 1.25rem',
            boxShadow: '0 0 0 2px transparent',
            backgroundColor: 'white',
            border: '2px solid #e2e8f0',
            zIndex: 20,
            cursor: refreshing ? 'not-allowed' : 'pointer',
          }}
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh Titles"
          )}
        </Button>
        
        <Button 
          onClick={handleStartGenerating} 
          disabled={selectedTitles.length === 0 || submitting}
          className={`relative transition-all duration-200 ${selectedTitles.length === 0 || submitting ? 'opacity-60' : 'bg-white hover:bg-white'}`}
          style={{
            borderRadius: '12px',
            position: 'relative',
            padding: '0.5rem 1.25rem',
            boxShadow: '0 0 0 2px transparent',
            background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #da44ff 0%, #8b5cf6 100%) border-box',
            border: '2px solid transparent',
            zIndex: 20,
            cursor: selectedTitles.length === 0 || submitting ? 'not-allowed' : 'pointer',
            pointerEvents: 'auto'
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Start Generating"
          )}
        </Button>
      </div>
    </div>
  );
}

export default MassScheduler;