import React from 'react';
import { Box, VStack, HStack, IconButton, Text, Button } from '@chakra-ui/react';
import { LuMoon, LuSun, LuArrowBigLeft} from "react-icons/lu";
import { DrawerBackdrop, DrawerBody, DrawerCloseTrigger, DrawerContent, DrawerHeader, DrawerPositioner, DrawerRoot } from '@chakra-ui/react';
import CustomSlider from './ui/Slider';

// Unified SidebarLayout component that works for both mobile and desktop
const SidebarLayout = ({
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

    const sidebarContent = (
        <VStack align="stretch" spacing={3} p={1} height="100%" bg={isMobile ? colorMode === 'light' ? "white" : "gray.900" : "transparent"}>
            {/* Header with Color Mode Toggle */}
            <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="lg" fontWeight="bold" color={colorMode === 'light' ? "semantic.text" : "white"}>
                    Settings & Filters
                </Text>
                {isMobile && (
                    <IconButton
                        onClick={toggleColorMode}
                        variant="outline"
                        size="sm"
                    >
                        {colorMode === "light" ? <LuSun /> : <LuMoon />}
                    </IconButton>
                )}
            </HStack>


            {/* Filter by participant model */}
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

            {/* Voltage range */}
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

            {/* Go Back Button - only show on mobile */}
            {isMobile && (
                <IconButton
                    onClick={() => setIsSidebarOpen(false)}
                    variant="outline"
                    size="bg"
                >
                    <LuArrowBigLeft size={40} strokeWidth={1}/>
                </IconButton>
            )}
        </VStack>
    );

    // Return different layouts based on mobile/desktop but same component
    if (isMobile) {
        return (
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
                            {isSidebarOpen && sidebarContent}
                        </DrawerBody>
                    </DrawerContent>
                </DrawerPositioner>
            </DrawerRoot>
        );
    } else {
        // Desktop layout - return the content directly
        return (
            <Box
                bg={colorMode === 'light' ? "brand.50" : "gray.800"}
                p={4}
                borderRadius="md"
                borderWidth="1px"
                borderColor="brand.500"
                boxShadow="sm"
                minH="240px"
                // height="240px"
                // overflowY="auto"
            >
                {sidebarContent}
            </Box>
        );
    }
};

// Keep the original Sidebar component for backward compatibility
const Sidebar = (props) => {
    return <SidebarLayout {...props} />;
};

export default Sidebar;
export { SidebarLayout };
