import React from 'react';
import { Box, VStack, HStack, IconButton, Portal, Select, createListCollection, Slider, Text, Button } from '@chakra-ui/react';
import { LuMoon, LuSun } from "react-icons/lu";
import { DrawerBackdrop, DrawerBody, DrawerCloseTrigger, DrawerContent, DrawerHeader, DrawerPositioner, DrawerRoot } from '@chakra-ui/react';

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
                    <Slider.Root
                        value={[volume]}
                        onValueChange={(details) => handleVolumeChange(details.value[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        flex={1}
                    >
                        <Slider.Control>
                            <Slider.Track>
                                <Slider.Range />
                            </Slider.Track>
                            <Slider.Thumb index={0}>
                                <Slider.HiddenInput />
                            </Slider.Thumb>
                        </Slider.Control>
                    </Slider.Root>
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
                    <Slider.Root
                        value={[playbackRate]}
                        onValueChange={(details) => handlePlaybackRateChange(details.value[0])}
                        min={0.5}
                        max={4}
                        step={0.1}
                        flex={1}
                    >
                        <Slider.Control>
                            <Slider.Track>
                                <Slider.Range />
                            </Slider.Track>
                            <Slider.Thumb index={0}>
                                <Slider.HiddenInput />
                            </Slider.Thumb>
                        </Slider.Control>
                    </Slider.Root>
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

    // Desktop sidebar content
    const DesktopSidebarContent = () => (
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

            {/* Desktop Sidebar */}
            {!isMobile && <DesktopSidebarContent />}
        </>
    );
};

export default Sidebar;
