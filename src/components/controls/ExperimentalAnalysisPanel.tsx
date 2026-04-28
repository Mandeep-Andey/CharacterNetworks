import React from 'react';
import { Stack, Text, Card, Group, Badge, ScrollArea, Divider } from '@mantine/core';
import { useExperimentalData } from '../../context/ExperimentalDataContext';

const ExperimentalAnalysisPanel: React.FC = () => {
    const { graphData, rawEvents, lintReport, loading } = useExperimentalData();

    if (loading || !graphData || !rawEvents) {
        return <Text c="dimmed">Loading analytics...</Text>;
    }

    const totalInteractions = rawEvents.length;
    
    // medium distribution
    const mediums = rawEvents.reduce((acc, event) => {
        acc[event.medium] = (acc[event.medium] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // kind distribution
    const kinds = rawEvents.reduce((acc, event) => {
        acc[event.interaction_kind] = (acc[event.interaction_kind] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // collect all flags
    const flagsCount = rawEvents.reduce((acc, event) => {
        event.flags.forEach(flag => {
            acc[flag] = (acc[flag] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    const lintPassed = lintReport ? lintReport.passed : false;

    return (
        <ScrollArea h="100%" type="auto">
            <Stack gap="md">
                <Card withBorder shadow="sm" radius="md">
                    <Text fw={700} ff="serif" mb="xs">Evidence Lint Status</Text>
                    {lintReport ? (
                        <>
                            <Group justify="space-between" mb="xs">
                                <Text size="sm">Overall Status</Text>
                                <Badge color={lintPassed ? 'teal' : 'red'}>
                                    {lintPassed ? 'PASS' : 'FAIL'}
                                </Badge>
                            </Group>
                            <Divider my="sm" />
                            <Group justify="space-between">
                                <Text size="xs" c="dimmed">Total Events Checked:</Text>
                                <Text size="sm" fw={500}>{lintReport.total_events}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="xs" c="dimmed">Failed Events:</Text>
                                <Text size="sm" fw={500} c={lintReport.failed_events > 0 ? 'red' : undefined}>{lintReport.failed_events}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="xs" c="dimmed">Violations:</Text>
                                <Text size="sm" fw={500} c={lintReport.total_violations > 0 ? 'red' : undefined}>{lintReport.total_violations}</Text>
                            </Group>
                        </>
                    ) : (
                        <Text size="sm" c="dimmed">No lint report found.</Text>
                    )}
                </Card>

                <Card withBorder shadow="sm" radius="md">
                    <Text fw={700} ff="serif" mb="xs">Interaction Breakdown ({totalInteractions})</Text>
                    
                    <Text size="xs" fw={600} tt="uppercase" c="dimmed" mt="md" mb="xs">By Kind</Text>
                    {Object.entries(kinds).map(([kind, count]) => (
                        <Group justify="space-between" key={`kind-${kind}`} mb="xs">
                            <Text size="sm" style={{ textTransform: 'capitalize' }}>{kind.replace(/_/g, ' ')}</Text>
                            <Badge variant="light" color="indigo">{count}</Badge>
                        </Group>
                    ))}

                    <Text size="xs" fw={600} tt="uppercase" c="dimmed" mt="md" mb="xs">By Medium</Text>
                    {Object.entries(mediums).map(([medium, count]) => (
                        <Group justify="space-between" key={`medium-${medium}`} mb="xs">
                            <Text size="sm" style={{ textTransform: 'capitalize' }}>{medium}</Text>
                            <Text size="sm" fw={500}>{count}</Text>
                        </Group>
                    ))}
                </Card>

                <Card withBorder shadow="sm" radius="md">
                    <Group justify="space-between" mb="xs">
                        <Text fw={700} ff="serif">Warnings & Flags</Text>
                        <Badge size="sm" color={Object.keys(flagsCount).length > 0 ? "orange" : "gray"}>
                            {Object.keys(flagsCount).length} types
                        </Badge>
                    </Group>
                    
                    {Object.keys(flagsCount).length === 0 ? (
                        <Text size="sm" c="dimmed">No warnings flagged in this chapter.</Text>
                    ) : (
                        Object.entries(flagsCount).map(([flag, count]) => (
                            <Group justify="space-between" key={`flag-${flag}`} mb="xs">
                                <Badge color="orange" variant="outline" style={{ textTransform: 'none' }}>{flag}</Badge>
                                <Text size="sm" fw={500}>{count}</Text>
                            </Group>
                        ))
                    )}
                </Card>

            </Stack>
        </ScrollArea>
    );
};

export default ExperimentalAnalysisPanel;
