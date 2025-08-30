import React, { useRef, useEffect } from 'react';
import { Box, HStack, VStack, Text, IconButton, useBreakpointValue } from '@chakra-ui/react';
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
  const scrollableBoxRef = useRef(null);

  const inner_height = useBreakpointValue({ base: '300px', md: 'min(100%, calc(66.6667vw * 2 / 3))' });

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

      // Get the position of the message relative to the scrollable container
      const containerRect = container.getBoundingClientRect();
      const messageRect = messageElement.getBoundingClientRect();

      // Calculate the message's position relative to the scrollable container
      const messageTopRelativeToContainer = messageRect.top - containerRect.top + container.scrollTop;
      const messageHeight = messageElement.offsetHeight;

      // Get the container height for centering calculation
      const containerHeight = container.clientHeight;

      // Calculate scroll position to center the message in the container
      const scrollTo = messageTopRelativeToContainer - (containerHeight / 2) + (messageHeight / 2);

      container.scrollTo({
        top: Math.max(0, scrollTo), // Ensure we don't scroll to negative values
        behavior: 'smooth'
      });
    }
  }, [currentSyncIndex, followCurrentMessage]);


  if (!Array.isArray(messages)) {
    console.error("MessageHistory: 'messages' prop is not an array. Received:", messages);
    return null;
  }

  // Precompute cumulative count of shock messages to determine voltage per occurrence
  const shockCumulativeCounts = messages.reduce((acc, msg, i) => {
    const previousCount = i === 0 ? 0 : acc[i - 1];
    acc[i] = previousCount + (msg.text === 'ELECTRIC_SHOCK_IMAGE' ? 1 : 0);
    return acc;
  }, []);

  return (
    <Box height="100%"
      borderWidth="1px"
      borderColor="brand.500"
      borderRadius="md"
      boxShadow="md"
      bg={colorMode === 'light' ? "brand.50" : "gray.800"}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack
        width="100%"
        p={4}
        height={inner_height}
        overflowY="auto"
        ref={messageBoxRef}
      >
        <HStack
          justifyContent="space-between"
          alignItems="center"
          position="sticky"
          top="0"
          bg={colorMode === 'light' ? "brand.50" : "gray.800"}
          zIndex="1"
          borderTopRadius="md"
        >
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
            const isShockMessage = message.text === 'ELECTRIC_SHOCK_IMAGE';
            const voltage = isShockMessage ? shockCumulativeCounts[index] * 45 : null;

            return (
              <Box
                key={`${message.speaker}-${index}-${message.text?.substring(0, 20)}`}
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
                <Text fontWeight="bold" color={
                  message.speaker === 'Professor' ? (colorMode === 'dark' ? 'brand.300' : 'brand.500') :
                    message.speaker === 'Learner' ? (colorMode === 'dark' ? 'teal.300' : 'teal.500') :
                      message.speaker === 'SHOCKING_DEVICE' ? (colorMode === 'dark' ? 'teal.300' : 'teal.500') :
                        (colorMode === 'dark' ? 'ruby.300' : 'ruby.500')
                }>
                  {message.speaker === 'SHOCKING_DEVICE' ? 'Learner' : message.speaker}
                </Text>
                <Text color={colorMode === 'light' ? "semantic.text" : "white"}>
                  {isShockMessage ? (
                    <Text as="span" color="voltage.danger">⚡ Electric Shock ({voltage}V)⚡</Text>
                  ) : (
                    message.text
                  )}
                </Text>
              </Box>
            );
          })}
        </Box>
      </VStack>
    </Box>
  );
};

export default MessageHistory;