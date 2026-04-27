import React from 'react';
import { Group, Title, Text, Anchor, Container, Box, Modal, List } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useViewMode } from '../../context/ViewModeContext';

const SiteHeader: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const { viewMode, setViewMode } = useViewMode();

  return (
    <>
      <Modal opened={opened} onClose={close} title="About the Project" centered size="lg">
        <Text size="sm" mb="sm">
          This interactive dashboard visualizes the character networks in George Eliot's <i>Middlemarch</i>.
          It allows users to explore the complex web of relationships, interactions, and social dynamics that define the novel.
        </Text>
        <Text size="sm" mb="sm">
          <b>Key Features:</b>
        </Text>
        <List size="sm" mb="sm">
          <List.Item><b>Dynamic Graphs:</b> Visualize character connections for each chapter.</List.Item>
          <List.Item><b>Interactive Filters:</b> Filter by character groups and interaction types.</List.Item>
          <List.Item><b>Evidence Inspector:</b> View textual evidence for every interaction.</List.Item>
        </List>
        <Text size="sm" c="dimmed">
          Project created for the George Eliot Archive.
        </Text>
      </Modal>

      <Box component="header" bg="white" c="dark.9" style={{ borderBottom: '4px solid #800000', height: '100%' }}>
        <Container size="xl" h="100%" px="md">
          <Group justify="space-between" h="100%">
            <Group>
              <Box w={40} h={40} bg="#800000" c="white" style={{ borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text fw={700} ff="serif" size="xl">M</Text>
              </Box>
              <div>
                <Title order={1} size="h3" c="#800000" ff="serif" style={{ lineHeight: 1.1 }}>George Eliot Archive</Title>
                <Text size="xs" tt="uppercase" c="dimmed" style={{ letterSpacing: '1px' }}>Middlemarch Character Network</Text>
              </div>
            </Group>

            <Group visibleFrom="md" gap="lg">
              <Group gap="xs" style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '2px', background: '#f8f9fa' }}>
                  <Text size="xs" fw={viewMode === 'stable' ? 700 : 400} c={viewMode === 'stable' ? '#800000' : 'dimmed'} 
                        px="sm" py={4} style={{ cursor: 'pointer', background: viewMode === 'stable' ? 'white' : 'transparent', borderRadius: '2px', transition: 'all 0.2s' }}
                        onClick={() => setViewMode('stable')}>Stable</Text>
                  <Text size="xs" fw={viewMode === 'experimental' ? 700 : 400} c={viewMode === 'experimental' ? '#800000' : 'dimmed'}
                        px="sm" py={4} style={{ cursor: 'pointer', background: viewMode === 'experimental' ? 'white' : 'transparent', borderRadius: '2px', transition: 'all 0.2s' }}
                        onClick={() => setViewMode('experimental')}>Pipeline v4</Text>
              </Group>

              <Anchor
                component="button"
                onClick={open}
                fw={600}
                tt="uppercase"
                size="sm"
                underline="never"
                style={{ transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#500000'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#800000'}
              >
                About
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </>
  );
};

export default SiteHeader;
