import { Box, Flex, Text } from '@chakra-ui/react';
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EWorkerCommand, IWorkerCPUDump, WorkerMessageResponse } from '../../../hardware/common/worker-service';
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

const MEM_ROW_BYTES = 16;
const MEM_ROW_HEIGHT_PX = 23;
const MEM_VISIBLE_ROWS = 32;
const MEM_OVERSCAN_ROWS = 8;
const MEM_SCROLL_THROTTLE_MS = 100;

const RegistersBlock = ({ registerValues }: { registerValues: Record<string, bigint> }) => {
  return (
    <Box h="100%" display="flex" flexDirection="column" minH={0}>
      <Text color={accent.regName} fontWeight="bold" fontSize="sm" mb={2}>
        Registers
      </Text>
      <Box flex="1" minH={0} overflowY="auto" pr={1} sx={monoStyles}>
        <Text as="div" fontSize="xs" lineHeight="1.65" whiteSpace="pre" color="gray.300">
          {Object.entries(registerValues).map(([reg, val]) => (
            <Fragment key={reg}>
              {reg.padEnd(5, ' ')} 0x{val.toString(16).toUpperCase().padStart(8, '0')} ({val.toString(10)}) {'\n'}
            </Fragment>
          ))}
        </Text>
      </Box>
    </Box>
  );
};

const HexRow = ({ row }: { row: number[] }) => {
  return (
    <span>
      {row.map((r, i) => {
        const b = r.toString(16).toUpperCase().padStart(2, '0');
        return (
          <span key={'hexrow' + i + b} className={`nibble-${b[0]} nibble2-${b[1]}`}>
            {b}{' '}
          </span>
        );
      })}

      {'        '}

      {row.map((r, i) => {
        const b = r.toString(16).toUpperCase().padStart(2, '0');
        const c = r > 31 && r < 127 ? String.fromCharCode(r) : '.';

        return (
          <span key={'strhexrow' + i + b} className={`nibble-${b[0]} nibble2-${b[1]}`}>
            {c}
          </span>
        );
      })}
    </span>
  );
};

function MemoryHexBlock({ dump, start, end }: { dump: any; start: number; end: number }) {
  const memory = dump.memory as Uint8Array;
  const totalRows = Math.ceil((end - start) / MEM_ROW_BYTES);
  const viewportPx = MEM_VISIBLE_ROWS * MEM_ROW_HEIGHT_PX;

  const [scrollTop, setScrollTop] = useState(0);
  const scrollTopPendingRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommitMsRef = useRef(-Infinity);

  const firstVisible = Math.floor(scrollTop / MEM_ROW_HEIGHT_PX);
  const lastVisible = Math.min(totalRows, Math.ceil((scrollTop + viewportPx) / MEM_ROW_HEIGHT_PX));
  const rangeStart = Math.max(0, firstVisible - MEM_OVERSCAN_ROWS);
  const rangeEnd = Math.min(totalRows, lastVisible + MEM_OVERSCAN_ROWS);

  const visibleSlices = useMemo(() => {
    const slices: number[][] = [];
    for (let i = rangeStart; i < rangeEnd; i++) {
      const off = start + i * MEM_ROW_BYTES;
      slices.push(Array.from(memory.slice(off, off + MEM_ROW_BYTES)));
    }
    return slices;
  }, [memory, start, rangeStart, rangeEnd]);

  const padTop = rangeStart * MEM_ROW_HEIGHT_PX;
  const padBottom = Math.max(0, totalRows - rangeEnd) * MEM_ROW_HEIGHT_PX;

  const commitScrollTop = useCallback(() => {
    lastCommitMsRef.current = performance.now();
    setScrollTop(scrollTopPendingRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (throttleTimerRef.current != null) clearTimeout(throttleTimerRef.current);
    };
  }, []);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      scrollTopPendingRef.current = e.currentTarget.scrollTop;

      if (rafRef.current != null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        const now = performance.now();
        const delta = now - lastCommitMsRef.current;

        if (delta >= MEM_SCROLL_THROTTLE_MS) {
          commitScrollTop();
          return;
        }

        if (throttleTimerRef.current != null) clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = setTimeout(() => {
          throttleTimerRef.current = null;
          commitScrollTop();
        }, MEM_SCROLL_THROTTLE_MS - delta);
      });
    },
    [commitScrollTop],
  );

  return (
    <Box w="100%" h="100%" display="flex" flexDirection="column" minH={0} sx={monoStyles}>
      <Text color={accent.regName} fontWeight="bold" fontSize="sm" mb={1}>
        Memory
      </Text>
      <Box
        h={`${viewportPx}px`}
        flexShrink={0}
        overflowY="auto"
        borderWidth="1px"
        borderColor={panel.borderColor}
        rounded="md"
        bg={panel.bg}
        px={2}
        py={1.5}
        onScroll={onScroll}
      >
        <Box pt={`${padTop}px`} pb={`${padBottom}px`}>
          {visibleSlices.map((row, j) => {
            const i = rangeStart + j;
            return (
              <Text
                as="div"
                key={start + i * MEM_ROW_BYTES}
                fontSize="md"
                fontWeight="bold"
                lineHeight={`${MEM_ROW_HEIGHT_PX}px`}
                minH={`${MEM_ROW_HEIGHT_PX}px`}
                whiteSpace="pre"
                color="gray.300"
                m={0}
              >
                {(start + i * MEM_ROW_BYTES).toString(16).toUpperCase().padStart(8, '0')}
                {'  '}
                <HexRow row={row} />
              </Text>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

function MemoryTerminal() {
  const { simulator } = useSimulator();
  const [dump, setDump] = useState<IWorkerCPUDump | null>(null);
  const [loading, setLoading] = useState(true);

  const onDump = useCallback((response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
    setDump(response.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const ws = simulator.workerService;
    ws.on(EWorkerCommand.CPU_DUMP, onDump);
    ws.requestCpuDump();

    return () => {
      ws.off(EWorkerCommand.CPU_DUMP, onDump);
    };
  }, [simulator.workerService, onDump]);

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
        '.nibble-0.nibble2-0': { color: 'gray' },
        '.nibble-0': { color: 'oklch(75% .18 360)' },
        '.nibble-1': { color: 'oklch(75% .18 23)' },
        '.nibble-2': { color: 'oklch(75% .18 50)' },
        '.nibble-3': { color: 'oklch(75% .18 65)' },
        '.nibble-4': { color: 'oklch(75% .18 77)' },
        '.nibble-5': { color: 'oklch(75% .18 103)' },
        '.nibble-6': { color: 'oklch(75% .18 130)' },
        '.nibble-7': { color: 'oklch(75% .18 142)' },
        '.nibble-8': { color: 'oklch(75% .18 150)' },
        '.nibble-9': { color: 'oklch(75% .18 163)' },
        '.nibble-A': { color: 'oklch(75% .18 184)' },
        '.nibble-B': { color: 'oklch(75% .18 209)' },
        '.nibble-C': { color: 'oklch(75% .18 232)' },
        '.nibble-D': { color: 'oklch(75% .18 254)' },
        '.nibble-E': { color: 'oklch(75% .18 294)' },
        '.nibble-F': { color: 'oklch(75% .18 328)' },
        '.nibble-F.nibble2-F': { color: 'white' },
      }}
    >
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={3} mb={2}>
        <Flex direction="column" justify="space-between" flexWrap="wrap" gap={3} mb={2}>
          <Text fontWeight="bold">
            Last executed instruction:{' '}
            {!dump?.lastExecutedInstruction
              ? '-'
              : simulator.processor.stringifyInstruction(dump.lastExecutedInstruction)}
          </Text>
          <Text fontWeight="bold">Current cycle: {Number(dump?.cycle) || 0}</Text>
        </Flex>
      </Flex>

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
            <MemoryHexBlock dump={dump} start={0} end={simulator.processor.memorySize} />
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
      ) : !loading ? (
        <Text fontSize="sm" color={accent.muted} mt={4}>
          Nenhum snapshot disponível.
        </Text>
      ) : null}
    </Box>
  );
}

export default memo(MemoryTerminal);
