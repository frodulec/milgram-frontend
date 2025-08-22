import React, { useRef, useEffect } from 'react';
import { Box, HStack, VStack, Text, IconButton, useBreakpointValue, Button } from '@chakra-ui/react';
import { LuPin, LuPinOff } from 'react-icons/lu';

const MessageHistory = ({
  messages,
  currentSyncIndex,
  colorMode,
  followCurrentMessage,
  onToggleFollow,
}) => {
  const messageRefs = useRef({});
  const messageBoxRef = useRef({});
  const scrollableBoxRef = useRef(null); // New ref for the scrollable Box

  const height = useBreakpointValue({ base: '400px', md: '600px' });

  // Scroll to the current message when currentSyncIndex changes
useEffect(() => {
  if (followCurrentMessage &&
    currentSyncIndex !== null &&
    currentSyncIndex >= 0 &&
    messageRefs.current[currentSyncIndex] &&
    scrollableBoxRef.current &&
    messageBoxRef.current) {
    
    const messageElement = messageRefs.current[currentSyncIndex];
    const container = scrollableBoxRef.current;
    const outerContainer = messageBoxRef.current;
    
    // Get the position of the message relative to the scrollable container
    const messageTop = messageElement.offsetTop;
    const messageHeight = messageElement.offsetHeight;
    
    // Use the outer container height for centering calculation
    const outerContainerHeight = outerContainer.clientHeight;
    // Account for the sticky header height
    const headerHeight = 60; // Approximate height of the sticky header
    const availableHeight = outerContainerHeight - headerHeight;
    
    // Calculate scroll position to center the message in the outer container
    const scrollTo = messageTop - (availableHeight / 2) + (messageHeight / 2);
    
    container.scrollTo({
      top: scrollTo,
      behavior: 'smooth'
    });
  }
}, [currentSyncIndex, followCurrentMessage]);


  // // Handle scroll up/down button clicks
  // const handleScroll = (direction) => {
  //   if (scrollableBoxRef.current) {
  //     const scrollAmount = direction === 'up' ? -50 : 50;
  //     scrollableBoxRef.current.scrollTop += scrollAmount;
  //   }
  // };
  if (!Array.isArray(messages)) {
    console.error("MessageHistory: 'messages' prop is not an array. Received:", messages);
    return null;
  }

  return (
    <HStack>


    <VStack
      width="100%"
      bg={colorMode === 'light' ? "brand.50" : "gray.800"}
      p={4}
      borderRadius="md"
      height={height}
      maxHeight={height}
      overflowY="auto"
      borderWidth="1px"
      borderColor="brand.500"
      boxShadow="md"
      ref={messageBoxRef}
    >
      <HStack
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        position="sticky"
        top="0"
        bg={colorMode === 'light' ? "brand.50" : "gray.800"}
        zIndex="1"
        p={2}
        borderTopRadius="md"
      >
        {/* Header content remains the same */}
        <Text
          fontSize="lg"
          fontWeight="bold"
          color={colorMode === 'light' ? "semantic.text" : "white"}
        >
          Conversation History
        </Text>
        <IconButton
          aria-label="Toggle auto-scroll"
          title={followCurrentMessage ? "Disable auto-scroll" : "Enable auto-scroll"}
          onClick={onToggleFollow}
          variant="outline"
          size="sm"
        >
          {followCurrentMessage ? <LuPinOff /> : <LuPin />}
        </IconButton>
      </HStack>
      <Box
        height={"100%"}
        width={"100%"}
        overflow={"auto"}
        ref={scrollableBoxRef}
        >
        {messages.map((message, index) => {
          const isCurrentlyPlaying = index === currentSyncIndex;

          return (
            <Box
              key={index}
              ref={el => messageRefs.current[index] = el}
              mb={2}
              p={2}
              bg={isCurrentlyPlaying
                ? (colorMode === 'light' ? "brand.200" : "brand.900")
                : (colorMode === 'light' ? "white" : "gray.700")
              }
              borderRadius="md"
              borderLeft={isCurrentlyPlaying ? "4px solid" : "none"}
              borderLeftColor="brand.500"
              borderWidth="1px"
              borderColor={isCurrentlyPlaying ? "brand.500" : (colorMode === 'light' ? "gray.200" : "gray.600")}
              boxShadow={isCurrentlyPlaying ? "md" : "xs"}
              transition="all 0.2s ease-in-out"
            >
              {/* Message content remains the same */}
              <Text fontWeight="bold" color={
                message.speaker === 'Professor' ? (colorMode === 'dark' ? 'brand.300' : 'brand.500') :
                  message.speaker === 'Learner' ? (colorMode === 'dark' ? 'teal.300' : 'teal.500') :
                    message.speaker === 'SHOCKING_DEVICE' ? (colorMode === 'dark' ? 'teal.300' : 'teal.500') :
                      (colorMode === 'dark' ? 'ruby.300' : 'ruby.500')
              }>
                {message.speaker === 'SHOCKING_DEVICE' ? 'Learner' : message.speaker}
              </Text>
              <Text color={colorMode === 'light' ? "semantic.text" : "white"}>
                {message.text === 'ELECTRIC_SHOCK_IMAGE' ?
                  <Text as="span" color="voltage.danger">⚡ Electric Shock ⚡</Text> :
                  message.text
                }
              </Text>
            </Box>
          );
        })}
      </Box>
    </VStack>
    </HStack>
  );
};

export default MessageHistory;