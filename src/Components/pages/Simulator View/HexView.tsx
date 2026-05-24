import { Box, Button, chakra, Flex, Icon, Text, Tooltip } from '@chakra-ui/react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FaBook } from 'react-icons/fa';
import { IoIosDownload } from 'react-icons/io';
import { IAssembledInstruction, ISimulator } from '../../../hardware/common/simulator';
import { EWorkerCommand, WorkerMessageResponse } from '../../../hardware/common/worker-service';
import { rv_codec } from '../../../hardware/riscv/riscv.const';
import { IDecodedRVInstruction } from '../../../hardware/riscv/riscv.types';
import * as rvUtils from '../../../hardware/riscv/riscv.utils';
import { useSimulator } from '../../../hooks/simulator.hook';

function cleanLine(line: string) {
  return line.replace(/#.*$/g, '').replace(/ +/g, ' ').trim();
}

const HexDisplayWrapper = chakra(Box, {
  baseStyle: {
    display: 'grid',
    gridTemplateColumns: 'minmax(8rem, 10rem) minmax(12rem, 1.1fr) 1fr minmax(2.75rem, 3.25rem)',
    columnGap: 4,
    '.bit-idx-4, .bit-idx-8, .bit-idx-12, .bit-idx-16, .bit-idx-20, .bit-idx-24, .bit-idx-28': {
      marginLeft: '8px',
    },
    '.funct7, .funct3, .opcode': {
      color: 'oklch(75% .18 23)',
    },
    '.funct7:hover span, .funct7:hover ~ .funct7 span': {
      background: '#666',
    },
    '.funct3:hover span, .funct3:hover ~ .funct3 span': {
      background: '#666',
    },
    '.imm': {
      color: 'oklch(75% .18 184)',
    },
    '.imm:hover span, .imm:hover ~ .imm span': {
      background: '#666',
    },
    '.opcode:hover span, .opcode:hover ~ .opcode span': {
      background: '#666',
    },
    '.rs1': {
      color: 'oklch(75% .18 103)',
    },
    '.rs1:hover span, .rs1:hover ~ .rs1 span': {
      background: '#666',
    },
    '.rs2': {
      color: 'oklch(75% .18 130)',
    },
    '.rs2:hover span, .rs2:hover ~ .rs2 span': {
      background: '#666',
    },
    '.rd': {
      color: 'oklch(75% .18 142)',
    },
    '.rd:hover span, .rd:hover ~ .rd span': {
      background: '#666',
    },
  },
});

const Bits = (props: { label: string; value: string; start: number; class?: string }) => (
  <Tooltip label={props.label}>
    <span className={props.class || ''}>
      {props.value.split('').map((bit, bitIdx) => (
        <span className={`bit-idx-${props.start + bitIdx} ${props.class || ''}`} key={props.label + bitIdx + bit}>
          {bit}
        </span>
      ))}
    </span>
  </Tooltip>
);

const InstructionDecRV = memo(({ inst }: { inst: IDecodedRVInstruction }) => {
  const el: React.ReactNode[] = [];

  const pad = (v: number | bigint, len: number) => v.toString(2).padStart(len, '0');

  if (inst.codec === rv_codec.r) {
    el.push(
      <Bits label="funct7" value={pad(rvUtils.operand_funct7(inst.bytecode), 7)} start={0} class="funct7" />,
      <Bits label="rs2" value={pad(inst.rs2, 5)} start={7} class="rs2" />,
      <Bits label="rs1" value={pad(inst.rs1, 5)} start={12} class="rs1" />,
      <Bits label="funct3" value={pad(rvUtils.operand_funct3(inst.bytecode), 3)} start={17} class="funct3" />,
      <Bits label="rd" value={pad(inst.rd, 5)} start={20} class="rd" />,
    );
  } else if (inst.codec === rv_codec.i) {
    el.push(
      <Bits label="imm[11:0]" value={pad(rvUtils.operand_funct7(inst.bytecode), 12)} start={0} class="rs2" />,
      <Bits label="rs1" value={pad(inst.rs1, 5)} start={12} class="rs1" />,
      <Bits label="funct3" value={pad(rvUtils.operand_funct3(inst.bytecode), 3)} start={17} class="funct3" />,
      <Bits label="rd" value={pad(inst.rd, 5)} start={20} class="rd" />,
    );
  } else if (inst.codec === rv_codec.s) {
    el.push(
      <Bits label="imm[11:5]" value={pad((inst.bytecode >> 25n) & 0x7fn, 7)} start={0} class="imm" />,
      <Bits label="rs2" value={pad(inst.rs2, 5)} start={7} class="rs2" />,
      <Bits label="rs1" value={pad(inst.rs1, 5)} start={12} class="rs1" />,
      <Bits label="funct3" value={pad(rvUtils.operand_funct3(inst.bytecode), 3)} start={17} class="funct3" />,
      <Bits label="imm[4:0]" value={pad((inst.bytecode >> 7n) & 0x1fn, 5)} start={20} class="imm" />,
    );
  } else if (inst.codec === rv_codec.b) {
    el.push(
      <span className="imm">
        <Bits label="imm[12]" value={pad((inst.bytecode >> 31n) & 1n, 1)} start={0} class="imm" />
        <Bits label="imm[10:5]" value={pad((inst.bytecode >> 25n) & 0x3fn, 6)} start={1} class="imm" />
      </span>,
      <Bits label="rs2" value={pad(inst.rs2, 5)} start={7} class="rs2" />,
      <Bits label="rs1" value={pad(inst.rs1, 5)} start={12} class="rs1" />,
      <Bits label="funct3" value={pad(rvUtils.operand_funct3(inst.bytecode), 3)} start={17} class="funct3" />,
      <span className="imm">
        <Bits label="imm[4:1]" value={pad((inst.bytecode >> 8n) & 0xfn, 4)} start={20} class="imm" />
        <Bits label="imm[11]" value={pad((inst.bytecode >> 7n) & 1n, 1)} start={24} class="imm" />
      </span>,
    );
  } else if (inst.codec === rv_codec.u) {
    el.push(
      <Bits label="imm[31:12]" value={pad(inst.bytecode >> 12n, 20)} start={0} class="imm" />,
      <Bits label="rd" value={pad(inst.rd, 5)} start={20} class="rd" />,
    );
  } else if (inst.codec === rv_codec.j) {
    el.push(
      <Bits label="imm[20]" value={pad((inst.bytecode >> 31n) & 1n, 1)} start={0} class="imm" />,
      <Bits label="imm[10:1]" value={pad((inst.bytecode >> 21n) & 0x3ffn, 1)} start={1} class="imm" />,
      <Bits label="imm[11]" value={pad((inst.bytecode >> 20n) & 1n, 1)} start={11} class="imm" />,
      <Bits label="imm[19:12]" value={pad((inst.bytecode >> 12n) & 0xffn, 1)} start={12} class="imm" />,
      <Bits label="rd" value={pad(inst.rd, 5)} start={20} class="rd" />,
    );
  }

  return (
    <Text color="gray.600" fontWeight="bold" fontSize="md" whiteSpace="nowrap">
      {el}
      <Bits label="opcode" value={pad(inst.opcode, 7)} start={25} class="opcode" />
    </Text>
  );
});

const HexDisplay = memo(
  ({ inst, simulator, isCurrent }: { inst: IAssembledInstruction; simulator: ISimulator; isCurrent: boolean }) => {
    const code = simulator.processor.stringifyInstruction(inst.decoded);
    const instruction = code.split(' ')[0];
    const manualUrl = simulator.linkToManual(instruction);

    return (
      <HexDisplayWrapper className={isCurrent ? 'current-instruction' : ''} data-inst-addr={inst.address}>
        <Box py={1} px={2} minH="10">
          <Text color="blue.500" fontWeight="bold" lineHeight="2.5rem">
            0x{inst.address.toString(16).toUpperCase().padStart(8, '0')}
          </Text>
        </Box>
        <Box py={1} px={2} minH="10">
          <Text color="pink.400" fontWeight="bold" whiteSpace="nowrap">
            0x{inst.decoded.bytecode.toString(16).toUpperCase().padStart(8, '0')}
          </Text>
          <InstructionDecRV inst={inst.decoded as IDecodedRVInstruction} />
        </Box>
        <Box py={1} px={2} minH="10">
          <Text color="purple.500" fontWeight="bold" wordBreak="break-word" lineHeight="2rem">
            {code}
          </Text>
          <Text color="gray.200" fontSize="xs">
            {inst.lineNumber}: {cleanLine(inst.code)}
          </Text>
        </Box>
        <Box py={1} minH="10" display="flex" alignItems="center" justifyContent="center">
          {instruction !== 'ILLEGAL' && (
            <a href={manualUrl} target="__blank" aria-label={'Abrir documentação da instrução ' + instruction}>
              <Icon as={FaBook} boxSize="1.15em" />
            </a>
          )}
        </Box>
      </HexDisplayWrapper>
    );
  },
);

const LabelDisplay = memo(({ label, address }: { label: string; address: bigint }) => (
  <Box backgroundColor="blackAlpha.400">
    <Box py={1} px={2} minH="10">
      <Text color="blue.500" fontWeight="bold" lineHeight="2.5rem">
        &lt;{label}&gt;:
      </Text>
    </Box>
  </Box>
));

function HexView({ program, labels }: { program: Array<IAssembledInstruction>; labels: Record<string, bigint> }) {
  const { simulator } = useSimulator();

  function downloadHex() {
    let hexString = '';
    program.forEach((i) => {
      hexString += `0x${i.decoded.bytecode.toString(16)}\n`;
    });
    const element = document.createElement('a');
    const file = new Blob([hexString], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'program.txt';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  const labelsByAddr = useMemo(() => {
    const kv: Record<string, string[]> = {};
    for (const [lab, _addr] of Object.entries(labels)) {
      let addr = _addr.toString();

      if (Array.isArray(kv[addr])) {
        kv[addr].push(lab);
      } else {
        kv[addr] = [lab];
      }
    }
    return kv;
  }, [labels]);

  const [currentPc, setCurrentPc] = useState<bigint | null>(null);

  const onDump = useCallback((response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
    const pc = response.data.cpu.pc;
    setCurrentPc(pc);

    //const lineNumber = program.find((inst) => inst.address === pc)?.lineNumber;
    //if (typeof lineNumber !== 'undefined') {
    //  const line = Number(lineNumber);

    //  SharedData.instance.monacoEditor.setPosition({ lineNumber: line, column: 1 });
    //  SharedData.instance.monacoEditor.revealLineInCenter(line);
    //}
  }, []);

  useEffect(() => {
    const ws = simulator.workerService;
    ws.on(EWorkerCommand.CPU_DUMP, onDump);
    ws.requestCpuDump();

    return () => {
      ws.off(EWorkerCommand.CPU_DUMP, onDump);
    };
  }, [simulator.workerService, onDump]);

  return (
    <>
      <Button onClick={downloadHex} leftIcon={<Icon as={IoIosDownload} />}>
        Download Hex
      </Button>

      <Box
        display="flex"
        flexDirection="column"
        marginTop={4}
        w="100%"
        alignItems="stretch"
        fontFamily="mono"
        letterSpacing="tight"
        sx={{
          fontVariantNumeric: 'tabular-nums',
          '.current-instruction': {
            background: 'rgba(243, 139, 168, .1)',
          },
        }}
      >
        <Box
          display="grid"
          gridTemplateColumns="minmax(8rem, 10rem) minmax(12rem, 1.1fr) 1fr minmax(2.75rem, 3.25rem)"
          columnGap={4}
        >
          <Box display="flex" alignItems="flex-end" pb={2} px={2} borderBottomWidth="1px" borderColor="gray.200">
            <Text color="blue.500" fontWeight="bold" fontSize="sm">
              Address
            </Text>
          </Box>
          <Box display="flex" alignItems="flex-end" pb={2} px={2} borderBottomWidth="1px" borderColor="gray.200">
            <Text color="pink.400" fontWeight="bold" fontSize="sm">
              Bytecode
            </Text>
          </Box>
          <Box display="flex" alignItems="flex-end" pb={2} px={2} borderBottomWidth="1px" borderColor="gray.200">
            <Text color="purple.500" fontWeight="bold" fontSize="sm">
              Instruction
            </Text>
          </Box>
          <Box
            display="flex"
            alignItems="flex-end"
            justifyContent="center"
            pb={2}
            borderBottomWidth="1px"
            borderColor="gray.200"
          >
            <Text color="gray.200" fontWeight="bold" fontSize="xs" textAlign="center">
              Manual
            </Text>
          </Box>
        </Box>

        {program.map((inst, idx) => {
          const curLabels = labelsByAddr[inst.address.toString()];

          return (
            <>
              {curLabels
                ? curLabels.map((l) => <LabelDisplay key={l + inst.address} address={inst.address} label={l} />)
                : null}

              <HexDisplay
                key={idx}
                inst={inst}
                simulator={simulator}
                isCurrent={currentPc !== null && inst.address === currentPc}
              />
            </>
          );
        })}
      </Box>
    </>
  );
}

export default memo(HexView);
