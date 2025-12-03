import React from 'react';
import { ScrollArea, Stack, Group, ColorSwatch, Text } from '@mantine/core';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';

const Legend: React.FC = () => {
    const { groups } = useData();
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    if (!groups) return null;

    const groupItems = Object.keys(groups).map((name, index) => ({
        id: index + 1,
        name: name
    }));

    return (
        <ScrollArea.Autosize mah={240} type="auto">
            <Stack gap="xs">
                {groupItems.map((group) => (
                    <Group key={group.id} gap="xs">
                        <ColorSwatch
                            color={colorScale(group.id.toString())}
                            size={12}
                            radius="xl"
                        />
                        <Text size="sm" c="dimmed">{group.name}</Text>
                    </Group>
                ))}
            </Stack>
        </ScrollArea.Autosize>
    );
};

export default Legend;
