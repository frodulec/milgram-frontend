import React from 'react';
import { Box, VStack, HStack, Text, Button } from '@chakra-ui/react';

const ResponsiveDialog = ({ isOpen, onClose, isMobile, colorMode, desktopContent, mobileContent, title = 'Information' }) => {
    if (!isOpen) return null;

    const backgroundColor = colorMode === 'light' ? 'white' : 'gray.800';
    const textColor = colorMode === 'light' ? 'semantic.text' : 'white';

    return (
        <>
            <Box
                position="fixed"
                top={0}
                right={0}
                bottom={0}
                left={0}
                bg="blackAlpha.600"
                zIndex={1000}
                onClick={onClose}
            />
            <Box
                position="fixed"
                top={0}
                right={0}
                bottom={0}
                left={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                zIndex={1001}
                onClick={onClose}
            >
                <Box
                    bg={backgroundColor}
                    color={textColor}
                    borderRadius="md"
                    boxShadow="xl"
                    borderWidth="1px"
                    borderColor="brand.500"
                    width={isMobile ? '95%' : '640px'}
                    maxW="95%"
                    p={4}
                    onClick={(e) => e.stopPropagation()}
                >
                    <HStack justifyContent="space-between" alignItems="center" mb={3}>
                        <Text fontSize="lg" fontWeight="bold">{title}</Text>
                        <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
                    </HStack>
                    <VStack align="stretch" spacing={3}>
                        {isMobile ? (mobileContent || (
                            <>
                                <Text>This is the mobile version of the dialog.</Text>
                                <Text>Content is optimized for smaller screens.</Text>
                            </>
                        )) : (desktopContent || (
                            <>
                                <Text>This is the desktop version of the dialog.</Text>
                                <Text>Use this space to provide helpful information.</Text>
                            </>
                        ))}
                    </VStack>
                </Box>
            </Box>
        </>
    );
};

export default ResponsiveDialog;


