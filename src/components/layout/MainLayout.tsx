import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell, Group, Text, ScrollArea, ActionIcon, LoadingOverlay, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import SiteHeader from './SiteHeader';
import ChapterList from '../navigation/ChapterList';
import ControlsSidebar from '../controls/ControlsSidebar';
import NodeDetailsPanel from '../graph/NodeDetailsPanel';
import ExperimentalAnalysisPanel from '../controls/ExperimentalAnalysisPanel';
import { useData } from '../../context/DataContext';
import { useViewMode } from '../../context/ViewModeContext';

const MainLayout: React.FC = () => {
    const { loading } = useData();
    const { viewMode } = useViewMode();
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
                <AppShell.Section p="md" pb="xs">
                    <Group justify="space-between" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                        <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-font-family-headings)', color: 'var(--mantine-color-primary-7)' }}>Controls</Text>
                        <ActionIcon variant="subtle" color="gray" onClick={toggleRight} hiddenFrom="sm">
                            ✕
                        </ActionIcon>
                    </Group>
                </AppShell.Section>
                
                <AppShell.Section grow component={ScrollArea} px="md">
                    {viewMode === 'experimental' ? <ExperimentalAnalysisPanel /> : <ControlsSidebar />}
                </AppShell.Section>

                <AppShell.Section p="md" pb="xs">
                    <Group justify="space-between" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                        <Text fw={700} size="lg" style={{ fontFamily: 'var(--mantine-font-family-headings)', color: 'var(--mantine-color-primary-7)' }}>Character Details</Text>
                    </Group>
                </AppShell.Section>

                <AppShell.Section grow component={ScrollArea} px="md">
                    <NodeDetailsPanel />
                </AppShell.Section>
            </AppShell.Aside>

            <AppShell.Main style={{ position: 'relative', height: '100vh', paddingTop: '80px', display: 'flex', flexDirection: 'column' }}>
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

                <Box style={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
                    <Outlet />
                </Box>
            </AppShell.Main>
        </AppShell>
    );
};

export default MainLayout;
