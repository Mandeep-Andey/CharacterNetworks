import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell, Group, Text, ScrollArea, ActionIcon, LoadingOverlay, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import SiteHeader from './SiteHeader';
import ChapterList from '../navigation/ChapterList';
import ControlsSidebar from '../controls/ControlsSidebar';
import { useData } from '../../context/DataContext';

const MainLayout: React.FC = () => {
    const { loading } = useData();
    const [leftOpened, { toggle: toggleLeft }] = useDisclosure(true);
    const [rightOpened, { toggle: toggleRight }] = useDisclosure(true);

    return (
        <AppShell
            header={{ height: 80 }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: !leftOpened, desktop: !leftOpened },
            }}
            aside={{
                width: 320,
                breakpoint: 'md',
                collapsed: { mobile: !rightOpened, desktop: !rightOpened },
            }}
            padding="0"
        >
            <AppShell.Header zIndex={101}>
                <SiteHeader />
            </AppShell.Header>

            <AppShell.Navbar style={{ zIndex: 100, backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <AppShell.Section p="md">
                    <Group justify="space-between" mb="md" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                        <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-font-family-headings)', color: 'var(--mantine-color-primary-7)' }}>Chapters</Text>
                        <ActionIcon variant="subtle" color="gray" onClick={toggleLeft} hiddenFrom="sm">
                            ✕
                        </ActionIcon>
                    </Group>
                </AppShell.Section>
                <AppShell.Section grow component={ScrollArea}>
                    <ChapterList />
                </AppShell.Section>
            </AppShell.Navbar>

            <AppShell.Aside style={{ zIndex: 100, backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <AppShell.Section p="md">
                    <Group justify="space-between" mb="md" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                        <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-font-family-headings)', color: 'var(--mantine-color-primary-7)' }}>Controls</Text>
                        <ActionIcon variant="subtle" color="gray" onClick={toggleRight} hiddenFrom="sm">
                            ✕
                        </ActionIcon>
                    </Group>
                </AppShell.Section>
                <AppShell.Section grow>
                    <ControlsSidebar />
                </AppShell.Section>
            </AppShell.Aside>

            <AppShell.Main style={{ position: 'relative', height: '100vh', paddingTop: '80px' }}>
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

                {/* Toggle buttons when collapsed */}
                {!leftOpened && (
                    <ActionIcon
                        variant="default"
                        size="lg"
                        pos="absolute"
                        top={96}
                        left={16}
                        style={{ zIndex: 90, boxShadow: 'var(--mantine-shadow-sm)' }}
                        onClick={toggleLeft}
                    >
                        ☰
                    </ActionIcon>
                )}
                {!rightOpened && (
                    <ActionIcon
                        variant="default"
                        size="lg"
                        pos="absolute"
                        top={96}
                        right={16}
                        style={{ zIndex: 90, boxShadow: 'var(--mantine-shadow-sm)' }}
                        onClick={toggleRight}
                    >
                        ⚙
                    </ActionIcon>
                )}

                <Box w="100%" h="100%">
                    <Outlet />
                </Box>
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;
