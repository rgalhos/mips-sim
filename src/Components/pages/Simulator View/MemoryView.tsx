import { Box, Flex, Text } from '@chakra-ui/react';
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
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

function mergeCpuDump(prev: IWorkerCPUDump | null, incoming: IWorkerCPUDump): IWorkerCPUDump {
  let memory: Uint8Array;
  if (prev && incoming.memory.length === 0) {
    memory = prev.memory;
  } else {
    memory = incoming.memory;
  }

  for (const [addr, val] of Object.entries(incoming.memoryDiff)) {
    memory[Number(addr)] = val;
  }

  return {
    cpu: incoming.cpu,
    cycle: incoming.cycle,
    halted: incoming.halted,
    lastExecutedInstruction: incoming.lastExecutedInstruction,
    memory,
    memoryDiff: {},
  };
}

function registerMapsEqual(a: Record<string, bigint>, b: Record<string, bigint>): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

const RegistersBlock = memo(
  function RegistersBlock({ registerValues }: { registerValues: Record<string, bigint> }) {
    return (
      <Box h="100%" display="flex" flexDirection="column" minH={0}>
        <Text color={accent.regName} fontWeight="bold" fontSize="sm" mb={2}>
          Registers
        </Text>
        <Box flex="1" minH={0} overflowY="auto" pr={1} sx={monoStyles}>
          <div
            style={{ fontSize: '12px', lineHeight: 1.65, whiteSpace: 'pre', color: 'var(--chakra-colors-gray-300)' }}
          >
            {Object.entries(registerValues).map(([reg, val]) => (
              <Fragment key={reg}>
                {reg.padEnd(5, ' ')} 0x{val.toString(16).toUpperCase().padStart(8, '0')} ({val.toString(10)}) {'\n'}
              </Fragment>
            ))}
          </div>
        </Box>
      </Box>
    );
  },
  (prev, next) => registerMapsEqual(prev.registerValues, next.registerValues),
);

function HexRow({ memory, offset }: { memory: Uint8Array; offset: number }) {
  const cells: ReactElement[] = [];
  for (let i = 0; i < MEM_ROW_BYTES; i++) {
    const r = memory[offset + i] ?? 0;
    const b = r.toString(16).toUpperCase().padStart(2, '0');
    cells.push(
      <span key={`h${i}`} className={`nibble-${b[0]} nibble2-${b[1]}`}>
        {b}{' '}
      </span>,
    );
  }
  const ascii: ReactElement[] = [];
  for (let i = 0; i < MEM_ROW_BYTES; i++) {
    const r = memory[offset + i] ?? 0;
    const b = r.toString(16).toUpperCase().padStart(2, '0');
    const c = r > 31 && r < 127 ? String.fromCharCode(r) : '.';
    ascii.push(
      <span key={`a${i}`} className={`nibble-${b[0]} nibble2-${b[1]}`}>
        {c}
      </span>,
    );
  }
  return (
    <span>
      {cells}
      {'        '}
      {ascii}
    </span>
  );
}

const memoryHexBlockRowSx = {
  ...monoStyles,
  '.mem-hex-row': {
    fontSize: 'md',
    fontWeight: 'bold',
    lineHeight: `${MEM_ROW_HEIGHT_PX}px`,
    minHeight: `${MEM_ROW_HEIGHT_PX}px`,
    whiteSpace: 'pre',
    color: 'gray.300',
    margin: 0,
  },
} as const;

function MemoryHexBlock({
  dump,
  start,
  end,
}: {
  dump: { memory: Uint8Array; cycle: number };
  start: number;
  end: number;
}) {
  const memory = dump.memory;
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

  const rows: ReactElement[] = [];
  for (let i = rangeStart; i < rangeEnd; i++) {
    const rowAddr = start + i * MEM_ROW_BYTES;
    const offset = rowAddr;
    rows.push(
      <div key={rowAddr} className="mem-hex-row">
        {rowAddr.toString(16).toUpperCase().padStart(8, '0')}
        {'  '}
        <HexRow memory={memory} offset={offset} />
      </div>,
    );
  }

  return (
    <Box w="100%" h="100%" display="flex" flexDirection="column" minH={0} sx={memoryHexBlockRowSx}>
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
          {rows}
        </Box>
      </Box>
    </Box>
  );
}

function MemoryView({ visible = true }: { visible?: boolean }) {
  const { simulator } = useSimulator();
  const [dump, setDump] = useState<IWorkerCPUDump | null>(null);
  const [loading, setLoading] = useState(true);
  const mergedDumpRef = useRef<IWorkerCPUDump | null>(null);

  const onDump = useCallback(
    (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
      const newDump = response.data;
      const merged = mergeCpuDump(mergedDumpRef.current, newDump);
      mergedDumpRef.current = merged;

      setLoading(false);
      if (visible) {
        setDump(merged);
      }
    },
    [visible],
  );

  useEffect(() => {
    if (!visible) return;
    if (mergedDumpRef.current) {
      setDump(mergedDumpRef.current);
    }
  }, [visible]);

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

export default memo(MemoryView);
