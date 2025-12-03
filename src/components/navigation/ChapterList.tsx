import React, { useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useControls } from '../../context/ControlsContext';
import { Stack, Title, SimpleGrid, Button, Box } from '@mantine/core';

const ChapterList: React.FC = () => {
    const { chapters, loading } = useData();
    const { isPlaying, setIsPlaying, playbackSpeed } = useControls();
    const navigate = useNavigate();
    const location = useLocation();
    const activeRef = useRef<HTMLAnchorElement>(null);

    // Flatten chapters for easy navigation
    const allChapters = useMemo(() => {
        if (!chapters) return [];
        const flat: { book: string; chapter: number; path: string }[] = [];
        Object.entries(chapters).forEach(([bookName, chapterList]) => {
            chapterList.forEach(chapter => {
                flat.push({
                    book: bookName,
                    chapter,
                    path: `/${bookName.replace(/\s+/g, '')}/${chapter}`
                });
            });
        });
        return flat;
    }, [chapters]);

    // Auto-play effect
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            const currentIndex = allChapters.findIndex(c => c.path === location.pathname);
            if (currentIndex !== -1 && currentIndex < allChapters.length - 1) {
                navigate(allChapters[currentIndex + 1].path);
            } else {
                setIsPlaying(false); // Stop at end
            }
        }, playbackSpeed);

        return () => clearInterval(interval);
    }, [isPlaying, allChapters, location.pathname, navigate, setIsPlaying, playbackSpeed]);

    // Scroll active chapter into view
    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [location.pathname]);

    if (loading || !chapters) {
        return <div className="p-4 text-gray-500 italic">Loading chapters...</div>;
    }

    return (
        <Stack gap="xl" pb={80}>
            <Box p="md">
                {Object.entries(chapters).map(([bookName, chapterList]) => (
                    <Box key={bookName} mb="xl">
                        <Title order={4} mb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', fontFamily: 'var(--mantine-font-family-headings)' }}>{bookName}</Title>
                        <SimpleGrid cols={4} spacing="xs">
                            {chapterList.map((chapter) => {
                                const path = `/${bookName.replace(/\s+/g, '')}/${chapter}`;
                                const isActive = location.pathname === path;
                                return (
                                    <Button
                                        key={chapter}
                                        component={NavLink}
                                        to={path}
                                        variant={isActive ? "filled" : "default"}
                                        color={isActive ? "accent" : "gray"}
                                        size="xs"
                                        ref={isActive ? activeRef : null}
                                        styles={{
                                            root: {
                                                '&:hover': {
                                                    borderColor: 'var(--mantine-color-accent-5)',
                                                    color: isActive ? 'white' : 'var(--mantine-color-accent-5)'
                                                }
                                            }
                                        }}
                                    >
                                        {chapter}
                                    </Button>
                                );
                            })}
                        </SimpleGrid>
                    </Box>
                ))}
            </Box>

            <Box pos="sticky" bottom={0} bg="white" p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)', zIndex: 10 }}>
                <Button
                    fullWidth
                    color={isPlaying ? 'red' : 'primary'}
                    onClick={() => setIsPlaying(!isPlaying)}
                    leftSection={isPlaying ? '⏸' : '▶'}
                >
                    {isPlaying ? 'Stop Auto-Play' : 'Auto-Play Chapters'}
                </Button>
            </Box>
        </Stack>
    );
};

export default ChapterList;
