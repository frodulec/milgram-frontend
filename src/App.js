import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, VStack, HStack, IconButton, Portal, Select, createListCollection, Slider, Text, Button, useBreakpointValue } from '@chakra-ui/react';
import { LuMoon, LuSun, LuMenu } from "react-icons/lu"
import { DrawerBackdrop, DrawerBody, DrawerCloseTrigger, DrawerContent, DrawerHeader, DrawerPositioner, DrawerRoot, DrawerTitle, DrawerTrigger } from '@chakra-ui/react'
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
  const [voltageRange, setVoltageRange] = useState([0, 450]);

  const [syncQueue, setSyncQueue] = useState([]);
  const [currentSyncIndex, setCurrentSyncIndex] = useState(-1);
  const [isProcessingSync, setIsProcessingSync] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const eventSourceRef = useRef(null);
  const messageRefs = useRef(new Map());

  // Use our audio player hook (without resetPlaybackState dependency)
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
    setCurrentImage,
    resetAudioPlayer
  } = useAudioPlayer({
    syncQueue,
    currentSyncIndex,
    setCurrentSyncIndex,
    isStarted
  });

  // Define resetPlaybackState function after the hook
  const resetPlaybackState = useCallback(() => {
    // Stop any ongoing streams
    if (eventSourceRef.current) {
      try { eventSourceRef.current.close(); } catch (_) { }
      eventSourceRef.current = null;
    }

    setMessages([]);
    setSyncQueue([]);
    setCurrentSyncIndex(-1);
  }, []);

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
          const volts = sorted
            .map(c => typeof c?.final_voltage === 'number' ? c.final_voltage : null)
            .filter(v => v !== null);
          const minV = volts.length ? Math.min(...volts) : 0;
          const maxV = volts.length ? Math.max(...volts) : 450;
          setVoltageRange([minV, maxV]);
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

  const filteredConversations = (allConversations || []).filter(c => {
    const modelOk = participantModelFilter === 'All' || (c?.config?.participant_model?.model || '') === participantModelFilter;
    const v = typeof c?.final_voltage === 'number' ? c.final_voltage : 0;
    const voltageOk = v >= voltageRange[0] && v <= voltageRange[1];
    return modelOk && voltageOk;
  });

  const resetAllFilters = () => {
    setParticipantModelFilter('All');
    // Compute full voltage range from all conversations
    const volts = (allConversations || [])
      .map(c => (typeof c?.final_voltage === 'number' ? c.final_voltage : null))
      .filter(v => v !== null);
    const minV = volts.length ? Math.min(...volts) : 0;
    const maxV = volts.length ? Math.max(...volts) : 450;
    setVoltageRange([minV, maxV]);

    if ((allConversations || []).length > 0) {
      const firstId = allConversations[0].id;
      setSelectedConversationId(firstId);
      loadConversationById(firstId);
    } else {
      setSelectedConversationId('');
      resetPlaybackStateComplete();
    }
  };

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
    if (!filteredConversations.find(c => c.id === selectedConversationId)) {
      setSelectedConversationId(filteredConversations[0]?.id || '');
      if (filteredConversations.length === 0) {
        // Clear current playback when no conversations match the filters
        resetPlaybackStateComplete();
      }
    }
  }, [participantModelFilter, allConversations, filteredConversations, selectedConversationId]);

  // Auto-load the currently selected conversation by default
  useEffect(() => {
    if (selectedConversationId) {
      // Only auto-load if nothing is currently loaded to avoid disrupting playback
      if (messages.length === 0) {
        loadConversationById(selectedConversationId);
      }
    }
  }, [selectedConversationId, allConversations]);

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

  // Extend the resetPlaybackState function to include audio player reset and image reloading
  const resetPlaybackStateComplete = useCallback(() => {
    // First call the basic reset
    resetPlaybackState();

    // Reset audio player state and UI
    resetAudioPlayer();
    setIsStarted(false);

    // Load a fresh default image again after clearing
    (async () => {
      try {
        const imageBlob = await imageGenerator.generateImage({});
        const imageUrl = URL.createObjectURL(imageBlob);
        setCurrentImage(imageUrl);
      } catch (error) {
        console.error('Failed to generate default image on reset:', error);
      }
    })();
  }, [resetPlaybackState, resetAudioPlayer, setCurrentImage]);

  const loadConversationById = (conversationId) => {
    if (!conversationId) return;
    const conv = (allConversations || []).find(c => c.id === conversationId);
    if (!conv) return;

    // Reset and load messages
    resetPlaybackStateComplete();

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

  // Responsive layout hook
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Sidebar content component for mobile
  const SidebarContent = () => (
    <VStack align="stretch" spacing={4} p={4} height="100%" bg={colorMode === 'light' ? "white" : "gray.900"}>
      {/* Header with Go Back button and Color Mode Toggle */}
      <VStack align="stretch" spacing={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="lg" fontWeight="bold" color={colorMode === 'light' ? "semantic.text" : "white"}>
            Settings & Filters
          </Text>
          <IconButton
            onClick={toggleColorMode}
            variant="outline"
            size="sm"
          >
            {colorMode === "light" ? <LuSun /> : <LuMoon />}
          </IconButton>
        </HStack>

        {/* Go Back Button */}
        <Button
          onClick={() => setIsSidebarOpen(false)}
          variant="outline"
          size="sm"
          width="100%"
          colorScheme="gray"
        >
          ← Go Back
        </Button>
      </VStack>

      {/* Conversation Selection Controls */}
      <VStack align="stretch" spacing={3} width="100%">
        <Select.Root
          collection={participantModelCollection}
          size="sm"
          width="100%"
          value={participantModelFilter ? [participantModelFilter] : []}
          onValueChange={(details) => setParticipantModelFilter(details.value[0] || 'All')}
        >
          <Select.HiddenSelect name="participant-model-filter" />
          <Select.Label>Filter by participant model</Select.Label>
          <Select.Control
            bg={colorMode === 'light' ? 'white' : 'gray.700'}
            borderWidth="1px"
            borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
            borderRadius="md"
          >
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

        <VStack spacing={1} align="stretch" width="100%">
          <Text fontSize="sm" color={colorMode === 'light' ? "semantic.text" : "white"}>
            Voltage range: {voltageRange[0]}V – {voltageRange[1]}V
          </Text>
          <Slider.Root
            value={voltageRange}
            onValueChange={(details) => setVoltageRange(details.value)}
            min={Math.min(voltageRange[0], voltageRange[1], 0)}
            max={Math.max(voltageRange[0], voltageRange[1], 450)}
            step={5}
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb index={0}>
                <Slider.HiddenInput />
              </Slider.Thumb>
              <Slider.Thumb index={1}>
                <Slider.HiddenInput />
              </Slider.Thumb>
            </Slider.Control>
          </Slider.Root>
        </VStack>

        <Text fontSize="sm" color={colorMode === 'light' ? "semantic.text" : "white"}>
          Select conversation
        </Text>
        <VStack spacing={2} align="stretch">
          <Select.Root
            collection={conversationCollection}
            size="sm"
            width="100%"
            value={selectedConversationId ? [selectedConversationId] : []}
            onValueChange={(details) => {
              const id = details.value[0] || '';
              if (id && id !== selectedConversationId) {
                resetPlaybackStateComplete();
                setSelectedConversationId(id);
                loadConversationById(id);
              }
            }}
          >
            <Select.HiddenSelect name="conversation-select" />
            <Select.Control
              bg={colorMode === 'light' ? 'white' : 'gray.700'}
              borderWidth="1px"
              borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
              borderRadius="md"
            >
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
          <Button colorScheme="brand" onClick={resetAllFilters} size="sm" width="100%">
            Reset filters
          </Button>
        </VStack>
      </VStack>
    </VStack>
  );

  return (
    <Box p={4} maxW="1200px" mx="auto">
      {/* Mobile Header with Menu Button */}
      {isMobile ? (
        <HStack justifyContent="space-between" alignItems="center" mb={4}>
          <IconButton
            onClick={() => setIsSidebarOpen(true)}
            variant="outline"
            size="sm"
          >
            <LuMenu />
          </IconButton>
          <Text fontSize="lg" fontWeight="bold" color={colorMode === 'light' ? "semantic.text" : "white"}>
            Milgram Experiment
          </Text>
          <Box /> {/* Spacer for center alignment */}
        </HStack>
      ) : (
        <HStack justifyContent="flex-end" alignItems="center" mb={4}>
          <IconButton
            onClick={toggleColorMode}
            variant="outline"
            size="sm"
          >
            {colorMode === "light" ? <LuSun /> : <LuMoon />}
          </IconButton>
        </HStack>
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <DrawerRoot
          open={isSidebarOpen}
          onOpenChange={(e) => setIsSidebarOpen(e.open)}
          placement="left"
          size="sm"
        >
          <DrawerBackdrop />
          <DrawerPositioner>
            <DrawerContent>
              <DrawerHeader>
                <DrawerCloseTrigger />
              </DrawerHeader>
              <DrawerBody>
                <SidebarContent />
              </DrawerBody>
            </DrawerContent>
          </DrawerPositioner>
        </DrawerRoot>
      )}

      {isMobile ? (
        /* Mobile Layout - Vertical stack with two main tiles */
        <VStack align="stretch" spacing={4}>
          {/* Mobile Tile 1: Image and Conversation History */}
          <VStack
            align="stretch"
            spacing={4}
            bg={colorMode === 'light' ? "brand.50" : "gray.800"}
            p={4}
            borderRadius="md"
            borderWidth="1px"
            borderColor="brand.500"
            boxShadow="md"
          >
            {/* Image Display */}
            <Box minH="300px">
              <ImageDisplay currentImage={currentImage} colorMode={colorMode} />
            </Box>
          </VStack>

          {/* Conversation History as separate tile */}
          <Box minH="300px" maxH="400px" overflow="auto">
            {filteredConversations.length === 0 ? (
              <Box
                bg={colorMode === 'light' ? "brand.50" : "gray.800"}
                p={4}
                borderRadius="md"
                height="100%"
                borderWidth="1px"
                borderColor="brand.500"
                boxShadow="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <VStack spacing={3}>
                  <Text color={colorMode === 'light' ? "semantic.text" : "white"}>
                    No conversations with selected filters
                  </Text>
                  <Button colorScheme="brand" onClick={resetAllFilters}>Reset filters</Button>
                </VStack>
              </Box>
            ) : (
              <MessageHistory
                messages={messages}
                currentSyncIndex={currentSyncIndex}
                colorMode={colorMode}
                followCurrentMessage={followCurrentMessage}
                onToggleFollow={() => setFollowCurrentMessage(prev => !prev)}
              />
            )}
          </Box>

          {/* Mobile Tile 2: Audio Controls Only */}
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
            isStarted={isStarted}
            runPlaybackFunc={() => startExperience({ new_conversation: false })}
            tileMinHeight="200px"
            tileHeight="auto"
            removeNestedBoxStyling={false}
          />
        </VStack>
      ) : (
        /* Desktop Layout - Original horizontal layout */
        <HStack align="flex-start" spacing={6}>
          {/* Left Column: Image and Audio Controls */}
          <VStack flex="1" align="stretch" spacing={4}>
            {/* Game Image Display with Placeholder */}
            <ImageDisplay currentImage={currentImage} colorMode={colorMode} />

            {/* Audio Controls (full width under the image) */}
            <Box width="100%">
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
                isStarted={isStarted}
                runPlaybackFunc={() => startExperience({ new_conversation: false })}
                tileMinHeight="240px"
                tileHeight="240px"
              />
            </Box>
          </VStack>

          {/* Right Column: Message History + Conversation selection (bottom right) */}
          <VStack flex="1" align="stretch" spacing={4}>
            {filteredConversations.length === 0 ? (
              <Box
                bg={colorMode === 'light' ? "brand.50" : "gray.800"}
                p={4}
                borderRadius="md"
                height="600px"
                overflowY="auto"
                borderWidth="1px"
                borderColor="brand.500"
                boxShadow="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <VStack spacing={3}>
                  <Text color={colorMode === 'light' ? "semantic.text" : "white"}>
                    No conversations with selected filters
                  </Text>
                  <Button colorScheme="brand" onClick={resetAllFilters}>Reset filters</Button>
                </VStack>
              </Box>
            ) : (
              <MessageHistory
                messages={messages}
                currentSyncIndex={currentSyncIndex}
                colorMode={colorMode}
                followCurrentMessage={followCurrentMessage}
                onToggleFollow={() => setFollowCurrentMessage(prev => !prev)}
              />
            )}

            {/* Conversation selection controls (bottom right) */}
            <Box
              bg={colorMode === 'light' ? "brand.50" : "gray.800"}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor="brand.500"
              boxShadow="sm"
              minH="240px"
              height="240px"
            >
              <VStack align="stretch" spacing={3} width="100%">
                <Select.Root
                  collection={participantModelCollection}
                  size="sm"
                  width="100%"
                  value={participantModelFilter ? [participantModelFilter] : []}
                  onValueChange={(details) => setParticipantModelFilter(details.value[0] || 'All')}
                >
                  <Select.HiddenSelect name="participant-model-filter" />
                  <Select.Label>Filter by participant model</Select.Label>
                  <Select.Control
                    bg={colorMode === 'light' ? 'white' : 'gray.700'}
                    borderWidth="1px"
                    borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
                    borderRadius="md"
                  >
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

                <VStack spacing={1} align="stretch" width="100%">
                  <Text fontSize="sm" color={colorMode === 'light' ? "semantic.text" : "white"}>
                    Voltage range: {voltageRange[0]}V – {voltageRange[1]}V
                  </Text>
                  <Slider.Root
                    value={voltageRange}
                    onValueChange={(details) => setVoltageRange(details.value)}
                    min={Math.min(voltageRange[0], voltageRange[1], 0)}
                    max={Math.max(voltageRange[0], voltageRange[1], 450)}
                    step={5}
                  >
                    <Slider.Control>
                      <Slider.Track>
                        <Slider.Range />
                      </Slider.Track>
                      <Slider.Thumb index={0}>
                        <Slider.HiddenInput />
                      </Slider.Thumb>
                      <Slider.Thumb index={1}>
                        <Slider.HiddenInput />
                      </Slider.Thumb>
                    </Slider.Control>
                  </Slider.Root>
                </VStack>

                <Text fontSize="sm" color={colorMode === 'light' ? "semantic.text" : "white"}>
                  Select conversation
                </Text>
                <HStack spacing={2} align="center">
                  <Box flex="1">
                    <Select.Root
                      collection={conversationCollection}
                      size="sm"
                      width="100%"
                      value={selectedConversationId ? [selectedConversationId] : []}
                      onValueChange={(details) => {
                        const id = details.value[0] || ''; if (id && id !== selectedConversationId) {
                          resetPlaybackStateComplete();
                          setSelectedConversationId(id);
                          loadConversationById(id);
                        }
                      }}
                    >
                      <Select.HiddenSelect name="conversation-select" />
                      <Select.Control
                        bg={colorMode === 'light' ? 'white' : 'gray.700'}
                        borderWidth="1px"
                        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
                        borderRadius="md"
                      >
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
                  </Box>
                  <Button colorScheme="brand" onClick={resetAllFilters}>Reset filters</Button>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </HStack>
      )}

      <audio ref={audioRef} />
    </Box>
  );
}

export default App;