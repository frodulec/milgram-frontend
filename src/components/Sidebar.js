import React from 'react';
import { Box, VStack, HStack, IconButton, Portal, Text, Button } from '@chakra-ui/react';
import { LuMoon, LuSun } from "react-icons/lu";
import { DrawerBackdrop, DrawerBody, DrawerCloseTrigger, DrawerContent, DrawerHeader, DrawerPositioner, DrawerRoot } from '@chakra-ui/react';
import CustomSlider from './ui/Slider';

const Sidebar = ({
    isMobile,
    isSidebarOpen,
    setIsSidebarOpen,
    colorMode,
    toggleColorMode,
    participantModelFilter,
    setParticipantModelFilter,
    voltageRange,
    setVoltageRange,
    selectedConversationId,
    setSelectedConversationId,
    volume,
    handleVolumeChange,
    playbackRate,
    handlePlaybackRateChange,
    participantModelCollection,
    conversationCollection,
    resetAllFilters,
    resetPlaybackStateComplete,
    loadConversationById
}) => {
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
                <Box>
                    <Text fontSize="sm" mb={2} color={colorMode === 'light' ? "semantic.text" : "white"}>
                        Filter by participant model
                    </Text>
                    <Box
                        as="select"
                        size="sm"
                        width="100%"
                        value={participantModelFilter}
                        onChange={(e) => setParticipantModelFilter(e.target.value)}
                        bg={colorMode === 'light' ? 'white' : 'gray.700'}
                        borderWidth="1px"
                        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
                        borderRadius="md"
                        p={2}
                        fontSize="sm"
                    >
                        {participantModelCollection?.items?.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </Box>
                </Box>

                <VStack spacing={1} align="stretch" width="100%">
                    <Text fontSize="sm" color={colorMode === 'light' ? "semantic.text" : "white"}>
                        Voltage range: {voltageRange[0]}V – {voltageRange[1]}V
                    </Text>
                    <CustomSlider
                        value={voltageRange}
                        onValueChange={(value) => setVoltageRange(value)}
                        min={Math.min(voltageRange[0], voltageRange[1], 0)}
                        max={Math.max(voltageRange[0], voltageRange[1], 450)}
                        step={5}
                        colorMode={colorMode}
                    />
                </VStack>

                {/* Conversation Selection */}
                <Box>
                    <Text fontSize="sm" mb={2} color={colorMode === 'light' ? "semantic.text" : "white"}>
                        Select conversation
                    </Text>
                    <Box
                        as="select"
                        size="sm"
                        width="100%"
                        value={selectedConversationId}
                        onChange={(e) => {
                            const id = e.target.value;
                            if (id && id !== selectedConversationId) {
                                resetPlaybackStateComplete();
                                setSelectedConversationId(id);
                                loadConversationById(id);
                            }
                        }}
                        bg={colorMode === 'light' ? 'white' : 'gray.700'}
                        borderWidth="1px"
                        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
                        borderRadius="md"
                        p={2}
                        fontSize="sm"
                    >
                        {conversationCollection?.items?.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </Box>
                </Box>

                {/* Reset Filters Button */}
                <Button
                    colorScheme="brand"
                    onClick={resetAllFilters}
                    size="sm"
                    width="100%"
                >
                    Reset filters
                </Button>
            </VStack>

            {/* Audio Settings Section */}
            <VStack align="stretch" spacing={3} width="100%">
                <Text fontSize="md" fontWeight="bold" color={colorMode === 'light' ? "semantic.text" : "white"}>
                    Audio Settings
                </Text>

                {/* Volume Control */}
                <HStack spacing={2}>
                    <Text
                        fontSize="sm"
                        minW="60px"
                        color={colorMode === 'light' ? "semantic.text" : "white"}
                    >
                        Volume:
                    </Text>
                    <CustomSlider
                        value={[volume]}
                        onValueChange={(value) => handleVolumeChange(value[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        colorMode={colorMode}
                        style={{ flex: 1 }}
                    />
                    <Text
                        fontSize="sm"
                        minW="30px"
                        color={colorMode === 'light' ? "semantic.text" : "white"}
                    >
                        {Math.round(volume * 100)}%
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
                    <CustomSlider
                        value={[playbackRate]}
                        onValueChange={(value) => handlePlaybackRateChange(value[0])}
                        min={0.5}
                        max={4}
                        step={0.1}
                        colorMode={colorMode}
                        style={{ flex: 1 }}
                    />
                    <Text
                        fontSize="sm"
                        minW="30px"
                        color={colorMode === 'light' ? "semantic.text" : "white"}
                    >
                        {playbackRate}x
                    </Text>
                </HStack>
            </VStack>
        </VStack>
    );


    return (
        <>
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
                                {isSidebarOpen && <SidebarContent />}
                            </DrawerBody>
                        </DrawerContent>
                    </DrawerPositioner>
                </DrawerRoot>
            )}

        </>
    );
};

export default Sidebar;
