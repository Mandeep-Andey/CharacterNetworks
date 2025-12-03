import React from 'react';
import { Group, Title, Text, Anchor, Container, Box } from '@mantine/core';

const SiteHeader: React.FC = () => {
  return (
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
            {['Home', 'About', 'Projects'].map((item) => (
              <Anchor
                key={item}
                href="#"
                c="white"
                fw={600}
                tt="uppercase"
                size="sm"
                underline="never"
                style={{ transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mantine-color-accent-2)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
              >
                {item}
              </Anchor>
            ))}
          </Group>
        </Group>
      </Container>
    </Box>
  );
};

export default SiteHeader;
