import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, VStack, Button, HStack, IconButton, Portal, Select, createListCollection } from '@chakra-ui/react';
import { LuMoon, LuSun } from "react-icons/lu"
import { useColorMode } from "./components/ui/color-mode";
import { imageGenerator } from './services/imageGenerator';
import { fetchTTSAudio, getNewContersationEventSource, fetchAllConversations } from './services/apiService';
import ImageDisplay from './components/ImageDisplay';
import AudioControls from './components/AudioControls';
import MessageHistory from './components/MessageHistory';
import { useAudioPlayer } from './hooks/useAudioPlayer';

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [messages, setMessages] = useState([]);
  const [isStarted, setIsStarted] = useState(false);
  const [followCurrentMessage, setFollowCurrentMessage] = useState(true);

  // Conversations management
  const [allConversations, setAllConversations] = useState([]);
  const [participantModelFilter, setParticipantModelFilter] = useState('All');
  const [selectedConversationId, setSelectedConversationId] = useState('');

  const [syncQueue, setSyncQueue] = useState([]);
  const [currentSyncIndex, setCurrentSyncIndex] = useState(-1);
  const [isProcessingSync, setIsProcessingSync] = useState(false);

  const eventSourceRef = useRef(null);
  const messageRefs = useRef(new Map());

  // Use our audio player hook
  const {
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
    setIsManuallyPaused,
    setCurrentImage
  } = useAudioPlayer({
    syncQueue,
    currentSyncIndex,
    setCurrentSyncIndex,
    isStarted
  });

  useEffect(() => {
    const loadDefaultImage = async () => {
      try {
        const imageBlob = await imageGenerator.generateImage({});
        const imageUrl = URL.createObjectURL(imageBlob);
        setCurrentImage(imageUrl);
      } catch (error) {
        console.error('Failed to generate default image:', error);
      }
    };

    loadDefaultImage();

    // Load all conversations on mount
    const loadConversations = async () => {
      try {
        const conversations = await fetchAllConversations();
        // Sort by timestamp descending if present
        const sorted = Array.isArray(conversations)
          ? [...conversations].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          : [];
        setAllConversations(sorted);
        // Initialize defaults
        if (sorted.length > 0) {
          setSelectedConversationId(sorted[0].id);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    };

    loadConversations();

    return () => {
      if (currentImage) {
        URL.revokeObjectURL(currentImage);
      }
    };
  }, []);

  // Derived options
  const participantModels = Array.from(
    new Set(
      (allConversations || [])
        .map(c => c?.config?.participant_model?.model)
        .filter(Boolean)
    )
  );

  const filteredConversations = (allConversations || []).filter(c =>
    participantModelFilter === 'All' || (c?.config?.participant_model?.model || '') === participantModelFilter
  );

  const participantModelCollection = useMemo(() => {
    const items = [
      { label: 'All', value: 'All' },
      ...participantModels.map(m => ({ label: m, value: m }))
    ];
    return createListCollection({ items });
  }, [participantModels]);

  const conversationCollection = useMemo(() => {
    const items = filteredConversations.map(c => {
      const model = c?.config?.participant_model?.model || 'unknown-model';
      const voltage = c?.final_voltage ? `${c.final_voltage}V` : '0V';
      const exp_id = c.id.slice(0, 8);

      const label = `${model} • ${voltage} • ${exp_id}`;
      return { label, value: c.id };
    });
    return createListCollection({ items });
  }, [filteredConversations]);

  useEffect(() => {
    // When filter changes, try keep selection valid
    if (!filteredConversations.find(c => c.id === selectedConversationId)) {
      setSelectedConversationId(filteredConversations[0]?.id || '');
    }
  }, [participantModelFilter, allConversations]);

  const startExperience = ({ new_conversation }) => {
    // If already started, just toggle play/pause
    if (isStarted) {
      togglePlayPause();
      return;
    }

    setIsManuallyPaused(false);

    // If starting from a chosen preloaded conversation, do not use the example SSE endpoint
    if (!new_conversation) {
      if (!selectedConversationId) {
        console.warn('No conversation selected.');
        return;
      }
      // Load selected conversation into messages and queue, then start
      loadSelectedConversation();
      setIsStarted(true);
      return;
    }

    // Otherwise, start a brand new conversation using the run-experiment stream
    setIsStarted(true);
    eventSourceRef.current = getNewContersationEventSource();

    eventSourceRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        setMessages(prev => [...prev, {
          speaker: data.speaker,
          text: data.text,
          timestamp: new Date()
        }]);
        addToSyncQueue(data.speaker, data.text);
      } else if (data.type === 'end') {
        eventSourceRef.current.close();
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('EventSource error:', error);
    };
  };

  const addToSyncQueue = (speaker, text) => {
    const syncItem = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      speaker,
      text,
      audioUrl: null,
      imageUrl: null,
      isProcessed: false
    };
    setSyncQueue(prev => {
      const queue = Array.isArray(prev) ? prev : [];
      return [...queue, syncItem];
    });
  };

  const resetPlaybackState = () => {
    setMessages([]);
    setSyncQueue([]);
    setCurrentSyncIndex(-1);
  };

  const loadConversationById = (conversationId) => {
    if (!conversationId) return;
    const conv = (allConversations || []).find(c => c.id === conversationId);
    if (!conv) return;

    // Reset and load messages
    resetPlaybackState();

    const incomingMessages = Array.isArray(conv.messages) ? conv.messages : [];
    const normalized = incomingMessages.map(m => ({
      speaker: m.speaker,
      text: m.text,
      timestamp: new Date()
    }));
    setMessages(normalized);

    // Queue processing for each message
    normalized.forEach(m => addToSyncQueue(m.speaker, m.text));
  };

  const loadSelectedConversation = () => {
    loadConversationById(selectedConversationId);
  };

  const processSyncQueue = useCallback(async () => {
    if (isProcessingSync) return;
    setSyncQueue(prevQueue => {
      if (!Array.isArray(prevQueue)) {
        console.warn('syncQueue is not an array, initializing as empty array');
        return [];
      }
      const unprocessedItems = prevQueue.filter(item => !item.isProcessed);

      if (unprocessedItems.length === 0 || isProcessingSync) {
        return prevQueue;
      }

      const currentItem = unprocessedItems[0];
      setIsProcessingSync(true);

      Promise.all([
        processAudioForItem(currentItem),
        processImageForItem(currentItem)
      ]).then(() => {
        setSyncQueue(queue =>
          queue.map(item =>
            item.id === currentItem.id
              ? { ...item, isProcessed: true }
              : item
          )
        );
        setIsProcessingSync(false);
      }).catch(error => {
        console.error('Failed to process sync item:', error);
        setIsProcessingSync(false);
      });

      return prevQueue;
    });
  }, [isProcessingSync]);

  const processAudioForItem = async (item) => {
    try {
      const audioBlob = await fetchTTSAudio(item.speaker, item.text);
      const audioUrl = URL.createObjectURL(audioBlob);

      setSyncQueue(prev =>
        prev.map(queueItem =>
          queueItem.id === item.id
            ? { ...queueItem, audioBlob, audioUrl }
            : queueItem
        )
      );
    } catch (error) {
      console.error('Failed to generate TTS:', error);
    }
  };

  const processImageForItem = async (item) => {
    try {
      const params = {};
      if (item.speaker === 'Learner') {
        params.learner_message = item.text;
      } else if (item.speaker === 'Professor') {
        params.professor_message = item.text;
      } else if (item.speaker === 'Participant') {
        params.participant_message = item.text;
      } else if (item.speaker === 'SHOCKING_DEVICE') {
        params.display_shock = true;
      }

      const imageBlob = await imageGenerator.generateImage(params);
      const imageUrl = URL.createObjectURL(imageBlob);

      setSyncQueue(prev =>
        prev.map(queueItem =>
          queueItem.id === item.id
            ? { ...queueItem, imageBlob, imageUrl }
            : queueItem
        )
      );
    } catch (error) {
      console.error('Failed to generate game image:', error);
    }
  };

  useEffect(() => {
    if (followCurrentMessage && messageRefs.current.has(currentSyncIndex)) {
      const node = messageRefs.current.get(currentSyncIndex);
      if (node) {
        node.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [currentSyncIndex, followCurrentMessage, messages]);

  useEffect(() => {
    processSyncQueue();
  }, [syncQueue, processSyncQueue]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up all blob URLs in the sync queue
      syncQueue.forEach(item => {
        if (item.audioUrl) URL.revokeObjectURL(item.audioUrl);
        if (item.imageUrl) URL.revokeObjectURL(item.imageUrl);
      });
      // Clean up current image if it exists
      if (currentImage) {
        URL.revokeObjectURL(currentImage);
      }
    };
  }, [syncQueue, currentImage]);

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <HStack justifyContent="space-between" alignItems="center" py={4} mb={4}>
        <Box textAlign="center">
          <Button
            colorScheme="brand"
            bg="brand.500"
            color="white"
            size="lg"
            onClick={() => startExperience({ new_conversation: false })}
          >
            {isStarted ? (isPlaying ? "Pause Experiment" : "Resume Experiment") : "Start Experiment"}
          </Button>
          {/* <Button
            colorScheme="brand"
            bg="brand.500"
            color="white"
            size="lg"
            onClick={() => startExperience({ new_conversation: true })}
          >
            {isStarted ? (isPlaying ? "Pause Experiment" : "Resume Experiment") : "New Conversation"}
          </Button> */}

          {/* Conversation selection controls */}
          <HStack mt={2} spacing={2}>
            <Select.Root
              collection={participantModelCollection}
              size="sm"
              width="260px"
              value={participantModelFilter ? [participantModelFilter] : []}
              onValueChange={(details) => setParticipantModelFilter(details.value[0] || 'All')}
            >
              <Select.HiddenSelect name="participant-model-filter" />
              <Select.Label>Filter by participant model</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Filter by participant model" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {participantModelCollection.items.map((item) => (
                      <Select.Item item={item} key={item.value}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>

            <Select.Root
              collection={conversationCollection}
              size="sm"
              width="360px"
              value={selectedConversationId ? [selectedConversationId] : []}
              onValueChange={(details) => {
                const id = details.value[0] || '';
                setSelectedConversationId(id);
                if (id) {
                  loadConversationById(id);
                }
              }}
            >
              <Select.HiddenSelect name="conversation-select" />
              <Select.Label>Select conversation</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Select conversation" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {conversationCollection.items.map((item) => (
                      <Select.Item item={item} key={item.value}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
            <Button
              colorScheme="brand"
              variant="outline"
              onClick={loadSelectedConversation}
              isDisabled={!selectedConversationId}
            >
              Load
            </Button>
          </HStack>
        </Box>
        <IconButton
          onClick={toggleColorMode}
          variant="outline"
          size="sm"
        >
          {colorMode === "light" ? <LuSun /> : <LuMoon />}
        </IconButton>
      </HStack>

      <HStack align="flex-start" spacing={6}>
        {/* Left Column: Image and Audio Controls */}
        <VStack flex="1" align="stretch" spacing={4}>
          {/* Game Image Display with Placeholder */}
          <ImageDisplay currentImage={currentImage} colorMode={colorMode} />

          {/* Audio Controls (now under the image) */}
          <AudioControls
            isPlaying={isPlaying}
            isMuted={isMuted}
            volume={volume}
            playbackRate={playbackRate}
            currentSyncIndex={currentSyncIndex}
            totalItems={syncQueue.length}
            onPlayPause={togglePlayPause}
            onPrevious={playPreviousItem}
            onNext={playNextItem}
            onMute={toggleMute}
            onVolumeChange={handleVolumeChange}
            onPlaybackRateChange={handlePlaybackRateChange}
            colorMode={colorMode}
            isQueueEmpty={syncQueue.length === 0}
            hidePlayPauseButton={true}
          />
        </VStack>

        {/* Right Column: Message History */}
        <MessageHistory
          messages={messages}
          currentSyncIndex={currentSyncIndex}
          colorMode={colorMode}
          followCurrentMessage={followCurrentMessage}
          onToggleFollow={() => setFollowCurrentMessage(prev => !prev)}
        />
      </HStack>

      <audio ref={audioRef} />
    </Box>
  );
}

export default App;