import { Box, Button, Flex, Spinner, Text } from '@chakra-ui/react';
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { ICPU } from '../../../hardware/common/processor';
import { useSimulator } from '../../../hooks/simulator.hook';

const monoStyles = {
  fontFamily: 'mono',
  letterSpacing: 'tight',
  fontVariantNumeric: 'tabular-nums' as const,
};

const panel = {
  bg: 'gray.900',
  borderColor: 'whiteAlpha.200',
} as const;

const accent = {
  label: 'blue.300',
  value: 'pink.200',
  regName: 'purple.300',
  muted: 'gray.400',
} as const;

const RegistersBlock = ({ registerValues }: { registerValues: Record<string, bigint> }) => {
  return (
    <Box h="100%" display="flex" flexDirection="column" minH={0}>
      <Text color={accent.regName} fontWeight="bold" fontSize="sm" mb={2}>
        Registers
      </Text>
      <Box flex="1" minH={0} overflowY="auto" pr={1} sx={monoStyles}>
        <Text as="div" fontSize="xs" lineHeight="1.65" whiteSpace="pre" color="gray.300">
          {Object.entries(registerValues).map(([reg, val]) => (
            <>
              {reg.padEnd(5, ' ')} 0x{val.toString(16).toUpperCase().padStart(8, '0')} ({val.toString(10)}) {'\n'}
            </>
          ))}
        </Text>
      </Box>
    </Box>
  );
};

const HexRow = ({ row }: { row: number[] }) => {
  return (
    <span>
      {row.map((r) => {
        const b = r.toString(16).toUpperCase().padStart(2, '0');
        return <span className={`byte-${b[0]} byte2-${b[1]}`}>{b} </span>;
      })}

      {'        '}

      {row.map((r) => {
        const b = r.toString(16).toUpperCase().padStart(2, '0');
        const c = r > 31 && r < 127 ? String.fromCharCode(r) : '.';

        return <span className={`byte-${b[0]} byte2-${b[1]}`}>{c}</span>;
      })}
    </span>
  );
};

function MemoryHexBlock({ dump, start, end }: { dump: any; start: number; end: number }) {
  const nRows = (end - start) / 16;
  const rows: number[][] = [];
  for (let i = 0; i < nRows; i++) {
    rows.push(Array.from(dump.memory.slice(start + i * 16, start + (i + 1) * 16)));
  }

  return (
    <Box w="100%" h="100%" display="flex" flexDirection="column" minH={0} sx={monoStyles}>
      <Text color={accent.regName} fontWeight="bold" fontSize="sm" mb={1}>
        Memory
      </Text>
      <Box
        flex="1"
        minH={0}
        overflowY="auto"
        borderWidth="1px"
        borderColor={panel.borderColor}
        rounded="md"
        bg={panel.bg}
        px={2}
        py={1.5}
      >
        <Text as="pre" fontSize="md" fontWeight="bold" lineHeight="1.45" whiteSpace="pre" color="gray.300" m={0}>
          {rows.map((row, i) => (
            <Fragment key={'rowmem' + i}>
              {(start + i * 16).toString(16).toUpperCase().padStart(8, '0')}
              {'  '}
              <HexRow row={row} />
              {'\n'}
            </Fragment>
          ))}
        </Text>
      </Box>
    </Box>
  );
}

function MemoryTerminal() {
  const { simulator } = useSimulator();
  const [dump, setDump] = useState<{ memory: Uint8Array; cpu: ICPU; cycle: bigint } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await simulator.workerService.requestCpuDump();
      setDump(data);
    } catch (e) {
      setDump(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [simulator]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const registerValues = useMemo(() => {
    if (!dump) return {};

    const reg: Record<string, bigint> = { pc: dump.cpu.pc };

    for (const [r, val] of Object.entries(dump.cpu.register)) {
      reg[simulator.processor.registers[r]] = val;
    }

    return reg;
  }, [dump, simulator.processor.registers]);

  return (
    <Box
      position="relative"
      w="100%"
      pt={2}
      sx={{
        // https://simonomi.dev/blog/color-code-your-bytes/
        '.byte-0.byte2-0': { color: 'gray' },
        '.byte-0': { color: 'oklch(75% .18 360)' },
        '.byte-1': { color: 'oklch(75% .18 23)' },
        '.byte-2': { color: 'oklch(75% .18 50)' },
        '.byte-3': { color: 'oklch(75% .18 65)' },
        '.byte-4': { color: 'oklch(75% .18 77)' },
        '.byte-5': { color: 'oklch(75% .18 103)' },
        '.byte-6': { color: 'oklch(75% .18 130)' },
        '.byte-7': { color: 'oklch(75% .18 142)' },
        '.byte-8': { color: 'oklch(75% .18 150)' },
        '.byte-9': { color: 'oklch(75% .18 163)' },
        '.byte-A': { color: 'oklch(75% .18 184)' },
        '.byte-B': { color: 'oklch(75% .18 209)' },
        '.byte-C': { color: 'oklch(75% .18 232)' },
        '.byte-D': { color: 'oklch(75% .18 254)' },
        '.byte-E': { color: 'oklch(75% .18 294)' },
        '.byte-F': { color: 'oklch(75% .18 328)' },
        '.byte-F.byte2-F': { color: 'white' },
      }}
    >
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={3} mb={2}>
        <Flex direction="column" justify="space-between" flexWrap="wrap" gap={3} mb={2}>
          <Text fontWeight="bold">Last executed instruction: @todo (0x@todo)</Text>
          <Text fontWeight="bold">Current cycle: {Number(dump?.cycle) || 0}</Text>
        </Flex>
        <Flex align="center" gap={3}>
          {loading ? <Spinner size="sm" color="blue.300" thickness="3px" /> : null}
          <Button size="sm" onClick={() => void refresh()} isDisabled={loading} variant="outline" colorScheme="blue">
            Atualizar
          </Button>
        </Flex>
      </Flex>

      {error ? (
        <Text fontSize="sm" color="red.300" mb={4} fontWeight="medium">
          {error}
        </Text>
      ) : null}

      {dump ? (
        <Flex
          align="stretch"
          gap={{ base: 6, lg: 8 }}
          flexDir={{ base: 'column', lg: 'row' }}
          w="100%"
          minH="min(65vh, 640px)"
          maxH="min(75vh, 720px)"
        >
          <Box flex="1 1 58%" minW={0} minH={0} display="flex" flexDirection="column" alignSelf="stretch">
            <MemoryHexBlock dump={dump} start={0} end={1024} />
          </Box>
          <Box
            flex={{ base: 'none', lg: '0 0 22rem' }}
            w={{ base: '100%', lg: 'auto' }}
            maxW={{ lg: '26rem' }}
            pl={{ lg: 4 }}
            borderLeftWidth={{ lg: '1px' }}
            borderColor={{ lg: 'whiteAlpha.200' }}
            display="flex"
            flexDirection="column"
            minH={0}
            alignSelf="stretch"
          >
            <RegistersBlock registerValues={registerValues} />
          </Box>
        </Flex>
      ) : !loading && !error ? (
        <Text fontSize="sm" color={accent.muted} mt={4}>
          Nenhum snapshot disponível.
        </Text>
      ) : null}
    </Box>
  );
}

export default memo(MemoryTerminal);
