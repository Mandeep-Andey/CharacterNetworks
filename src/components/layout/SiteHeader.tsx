import React from 'react';
import { Group, Title, Text, Anchor, Container, Box, Modal, List } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

const SiteHeader: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false);

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

      <Box component="header" bg="primary.7" c="white" style={{ borderBottom: '4px solid var(--mantine-color-accent-5)', height: '100%' }}>
        <Container size="xl" h="100%" px="md">
          <Group justify="space-between" h="100%">
            <Group>
              <Box w={40} h={40} bg="rgba(255,255,255,0.1)" style={{ borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text fw={700} ff="serif" size="xl">M</Text>
              </Box>
              <div>
                <Title order={1} size="h3" c="white" style={{ lineHeight: 1.1 }}>George Eliot Archive</Title>
                <Text size="xs" tt="uppercase" opacity={0.8} style={{ letterSpacing: '1px' }}>Middlemarch Character Network</Text>
              </div>
            </Group>

            <Group visibleFrom="md" gap="lg">
              <Anchor
                component="button"
                onClick={open}
                c="white"
                fw={600}
                tt="uppercase"
                size="sm"
                underline="never"
                style={{ transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mantine-color-accent-2)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
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
