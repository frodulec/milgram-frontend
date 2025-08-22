import { useState, useEffect, useCallback, useRef } from 'react';

export function useAudioPlayer({ syncQueue, currentSyncIndex, setCurrentSyncIndex, isStarted }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(2);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  const audioRef = useRef(null);

  const playNextItem = useCallback(() => {
    const nextIndex = currentSyncIndex + 1;

    if (nextIndex < syncQueue.length) {
      const nextItem = syncQueue[nextIndex];
      if (nextItem && nextItem.isProcessed) {
        setCurrentSyncIndex(nextIndex);
        setIsPlaying(false);
        setIsManuallyPaused(false);
      }
    } else {
      // We've reached the end of the queue - stop playback completely
      setIsPlaying(false);
      setIsManuallyPaused(true); // Prevent auto-restart
      // Don't change currentSyncIndex to avoid triggering restart
    }
  }, [syncQueue, currentSyncIndex, setCurrentSyncIndex]);


  const playPreviousItem = useCallback(() => {
    const previousIndex = currentSyncIndex - 1;

    if (previousIndex >= 0 && previousIndex < syncQueue.length) {
      const previousItem = syncQueue[previousIndex];
      if (previousItem && previousItem.isProcessed) {
        setCurrentSyncIndex(previousIndex);
        setIsPlaying(false);
        setIsManuallyPaused(false);
      }
    } else {
      setIsPlaying(false);
      setIsManuallyPaused(false);
    }
  }, [syncQueue, currentSyncIndex, setCurrentSyncIndex]);

  const playCurrentItem = useCallback(() => {
    if (syncQueue.length === 0 || currentSyncIndex < 0 || currentSyncIndex >= syncQueue.length) {
      return;
    }

    const currentItem = syncQueue[currentSyncIndex];

    if (!currentItem || !currentItem.isProcessed) {
      return;
    }

    if (currentItem.imageBlob) {
      setCurrentImage(prevImage => {
        if (prevImage) {
          URL.revokeObjectURL(prevImage);
        }
        return URL.createObjectURL(currentItem.imageBlob);
      });
    }

    if (currentItem.audioBlob && audioRef.current) {
      const audio = audioRef.current;

      // First pause and reset the current audio
      audio.pause();
      audio.currentTime = 0;

      // Create a new blob URL for the audio
      const audioUrl = URL.createObjectURL(currentItem.audioBlob);
      audio.src = audioUrl;

      // Store the cleanup function for this audio URL
      const cleanupAudioUrl = () => {
        URL.revokeObjectURL(audioUrl);
      };

      // Wait for the audio to be loaded before playing
      audio.onloadeddata = () => {
        // Only attempt to play if we're still in a playing state
        if (!isManuallyPaused) {
          audio.play().catch(error => {
            // Only log non-abort errors
            if (error.name !== 'AbortError') {
              console.error('Failed to play audio:', error);
              setIsPlaying(false);
              cleanupAudioUrl();
              playNextItem();
            }
          });
        }
      };

      // Store cleanup function so it can be called later
      audio.dataset.cleanupUrl = audioUrl;
    }
  }, [syncQueue, currentSyncIndex, playNextItem, isManuallyPaused]);

  // Effect to automatically start the very first item
  useEffect(() => {
    if (isStarted && !isManuallyPaused && syncQueue.length > 0 && currentSyncIndex === -1) {
      const firstItem = syncQueue[0];
      if (firstItem && firstItem.isProcessed) {
        setCurrentSyncIndex(0);
      }
    }
  }, [isStarted, isManuallyPaused, syncQueue, currentSyncIndex, setCurrentSyncIndex]);

  // Main autoplay effect
  useEffect(() => {
    // Only auto-play if we haven't reached the end of the queue
    if (!isPlaying && !isManuallyPaused && syncQueue.length > 0 && currentSyncIndex >= 0 && currentSyncIndex < syncQueue.length) {
      const currentItem = syncQueue[currentSyncIndex];
      if (currentItem && currentItem.isProcessed && isStarted) {
        playCurrentItem();
      }
    }
  }, [syncQueue, currentSyncIndex, isPlaying, isManuallyPaused, playCurrentItem, isStarted]);

  // Effect for audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      audio.volume = isMuted ? 0 : volume;
      audio.playbackRate = playbackRate;
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      if (!audio.ended) {
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Clean up the current audio URL if it exists
      if (audio.dataset.cleanupUrl) {
        URL.revokeObjectURL(audio.dataset.cleanupUrl);
        delete audio.dataset.cleanupUrl;
      }
      // Check if we're at the last item to prevent infinite loop
      const nextIndex = currentSyncIndex + 1;
      if (nextIndex >= syncQueue.length) {
        console.log('Reached end of conversation - stopping playback');
        setIsManuallyPaused(true); // Prevent auto-restart
        return;
      }
      setIsManuallyPaused(false);
      playNextItem();
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [volume, isMuted, playbackRate, playNextItem]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || currentSyncIndex === -1 || syncQueue.length === 0) {
      console.warn("Cannot toggle play/pause: Audio ref not ready or no item selected.");
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsManuallyPaused(true);
    } else {
      setIsManuallyPaused(false);
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        setIsPlaying(false);
      });
    }
  }, [isPlaying, currentSyncIndex, syncQueue]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.volume = newMuted ? 0 : volume;
      }
      return newMuted;
    });
  }, [volume]);

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume;
    }
  }, [isMuted]);

  const handlePlaybackRateChange = useCallback((newRate) => {
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }, []);

  const resetAudioPlayer = useCallback(() => {
    setIsPlaying(false);
    setIsMuted(false);
    setIsManuallyPaused(false);
    setCurrentImage(null);
  }, []);

  return {
    isPlaying,
    isMuted,
    volume,
    playbackRate,
    currentImage,
    audioRef,
    playNextItem,
    playPreviousItem,
    togglePlayPause,
    toggleMute,
    handleVolumeChange,
    handlePlaybackRateChange,
    resetAudioPlayer,
    setIsManuallyPaused,
    setCurrentImage
  };
}