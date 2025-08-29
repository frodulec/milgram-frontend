import React from 'react';
import { Box, HStack, IconButton, Text, Button } from '@chakra-ui/react';
import CustomSlider from './ui/Slider';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaForward, FaBackward } from 'react-icons/fa';

const AudioControls = ({
  isPlaying,
  isMuted,
  volume,
  playbackRate,
  currentSyncIndex,
  totalItems,
  onPlayPause,
  onPrevious,
  onNext,
  onMute,
  onVolumeChange,
  onPlaybackRateChange,
  colorMode,
  isQueueEmpty,
  hidePlayPauseButton = false,
  isStarted = false,
  runPlaybackFunc = null,
  tileMinHeight = null,
  tileHeight = "100%",
  removeNestedBoxStyling = false,
  hideVolumeAndSpeed = false
}) => {
  // Make sure to use runPlaybackFunc if provided, otherwise fallback to onPlayPause
  const handlePlaybackControl = () => {
    if (runPlaybackFunc) {
      runPlaybackFunc();
    } else {
      onPlayPause();
    }
  };

  // Then in your button:
  return (
    <Box
      bg={removeNestedBoxStyling ? 'transparent' : (colorMode === 'light' ? "brand.50" : "gray.800")}
      p={removeNestedBoxStyling ? 0 : 4}
      borderRadius={removeNestedBoxStyling ? 'none' : "md"}
      borderWidth={removeNestedBoxStyling ? 0 : "1px"}
      borderColor={removeNestedBoxStyling ? 'transparent' : "brand.500"}
      boxShadow={removeNestedBoxStyling ? 'none' : "sm"}
      minH={tileMinHeight || undefined}
      flex="1"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box maxW="720px" width={removeNestedBoxStyling ? "100%" : "80%"} mx="auto">

        {/* Playback Controls */}
        <HStack spacing={2} mb={hideVolumeAndSpeed ? 0 : 3} justifyContent="center">
          <IconButton
            size="lg"
            onClick={onPrevious}
            isDisabled={currentSyncIndex <= 0}
            aria-label="Previous"
            colorScheme="brand"
          >
            <FaBackward />
          </IconButton>

          <Box textAlign="center">
            <Button
              colorScheme="brand"
              bg="brand.500"
              color="white"
              size="lg"
              minW="200px"
              onClick={handlePlaybackControl}
            >
              {isStarted ? (isPlaying ? "Pause Experiment" : "Resume Experiment") : "Start Experiment"}
            </Button>
          </Box>

          {!hidePlayPauseButton && (
            <IconButton
              size="lg"
              onClick={onPlayPause}
              isDisabled={currentSyncIndex === -1}
              aria-label={isPlaying ? "Pause" : "Play"}
              colorScheme="brand"
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </IconButton>
          )}
          <IconButton
            size="lg"
            onClick={onNext}
            isDisabled={currentSyncIndex >= totalItems - 1}
            aria-label="Next"
            colorScheme="brand"
          >
            <FaForward />
          </IconButton>
          <IconButton
            size="lg"
            onClick={onMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            colorScheme="brand"
          >
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </IconButton>

        </HStack>

        {/* Volume and Speed Controls - Hidden in mobile when in sidebar */}
        {!hideVolumeAndSpeed && (
          <>
            {/* Volume Control */}
            <HStack spacing={2} mb={2}>
              <Text
                fontSize="sm"
                minW="60px"
                color={colorMode === 'light' ? "semantic.text" : "white"}
              >
                Volume:
              </Text>
              <Box flex={1}>
                <CustomSlider
                  value={[volume || 0]}
                  onValueChange={(value) => onVolumeChange && onVolumeChange(value[0])}
                  min={0}
                  max={1}
                  step={0.1}
                  colorMode={colorMode}
                />
              </Box>
              <Text
                fontSize="sm"
                minW="30px"
                color={colorMode === 'light' ? "semantic.text" : "white"}
              >
                {Math.round((volume || 0) * 100)}%
              </Text>
            </HStack>

            {/* Playback Speed Control */}
            <HStack spacing={2}>
              <Text
                fontSize="sm"
                minW="60px"
                color={colorMode === 'light' ? "semantic.text" : "white"}
              >
                Speed:
              </Text>
              <Box flex={1}>
                <CustomSlider
                  value={[playbackRate || 1]}
                  onValueChange={(value) => onPlaybackRateChange && onPlaybackRateChange(value[0])}
                  min={0.5}
                  max={4}
                  step={0.1}
                  colorMode={colorMode}
                />
              </Box>
              <Text
                fontSize="sm"
                minW="30px"
                color={colorMode === 'light' ? "semantic.text" : "white"}
              >
                {playbackRate || 1}x
              </Text>
            </HStack>
          </>
        )}
      </Box>
    </Box>
  );
};

export default AudioControls;