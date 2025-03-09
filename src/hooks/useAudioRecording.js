import { useState, useRef, useEffect } from 'react';

const useAudioRecording = (onTranscriptionComplete) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showMaxDurationAlert, setShowMaxDurationAlert] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendToWhisperAPI(audioBlob);
        
        // Stop all tracks in the stream to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Set up timer to track recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= 119) {
            // Auto-stop recording when reaching max duration
            stopRecording();
            clearInterval(recordingTimerRef.current);
            setShowMaxDurationAlert(true);
            
            // Hide alert after 5 seconds
            setTimeout(() => setShowMaxDurationAlert(false), 5000);
            return 119;
          }
          return newDuration;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      // Clear the timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };
  
  const sendToWhisperAPI = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");
      formData.append("model", "whisper-1");
      
      // Use our own API route instead of directly calling OpenAI
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Transcription failed: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Call the callback with the transcription result
      if (onTranscriptionComplete) {
        onTranscriptionComplete(data.text);
      }
    } catch (error) {
      console.error("Error with transcription:", error);
      alert("Failed to transcribe audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isProcessing) return; // Prevent toggling during processing
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    isRecording,
    isProcessing,
    recordingDuration,
    showMaxDurationAlert,
    toggleRecording,
    setShowMaxDurationAlert
  };
};

export default useAudioRecording;
