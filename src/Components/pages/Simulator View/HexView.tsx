import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { memo, useMemo } from 'react';
import { FaBook } from 'react-icons/fa';
import { IoIosDownload } from 'react-icons/io';
import { IAssembledInstruction, ISimulator } from '../../../hardware/common/simulator';
import { useSimulator } from '../../../hooks/simulator.hook';

function bytecodeBytesHex(bytecode: bigint | number) {
  const n = Number(bytecode) >>> 0;
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].map((b) => b.toString(16).padStart(2, '0'));
}

const HexDisplay = memo(({ inst, simulator }: { inst: IAssembledInstruction; simulator: ISimulator }) => {
  const bytes = bytecodeBytesHex(inst.decoded.bytecode);
  const code = simulator.processor.stringifyInstruction(inst.decoded);
  const instruction = code.split(' ')[0];
  const manualUrl = simulator.linkToManual(instruction);

  return (
    <div style={{ display: 'contents' }}>
      <Box py={1} minH="10">
        <Text color="blue.500" fontWeight="bold" lineHeight="2.5rem">
          0x{inst.address.toString(16).toUpperCase().padStart(8, '0')}
        </Text>
      </Box>
      <Box py={1} minH="10">
        <Flex flexWrap="wrap" alignItems="center" columnGap={3} rowGap={1} minH="2.5rem">
          <Text color="pink.400" fontWeight="bold" whiteSpace="nowrap">
            0x{inst.decoded.bytecode.toString(16).toUpperCase().padStart(8, '0')}
          </Text>
          {bytes.map((b, i) => (
            <Text key={i} color="gray.600" fontWeight="bold" whiteSpace="nowrap">
              0x{b}
            </Text>
          ))}
        </Flex>
      </Box>
      <Box py={1} minH="10">
        <Text color="purple.500" fontWeight="bold" wordBreak="break-word" lineHeight="2.5rem">
          {code}
        </Text>
      </Box>
      <Box py={1} minH="10" display="flex" alignItems="center" justifyContent="center">
        {instruction !== 'ILLEGAL' && (
          <a href={manualUrl} target="__blank" aria-label={'Abrir documentação da instrução ' + instruction}>
            <Icon as={FaBook} boxSize="1.15em" />
          </a>
        )}
      </Box>
    </div>
  );
});

const LabelDisplay = memo(({ label, address }: { label: string; address: bigint }) => (
  <Box backgroundColor="blackAlpha.400" sx={{ gridColumn: '1/-1' }}>
    <Box py={1} px={2} minH="10">
      <Text color="blue.500" fontWeight="bold" lineHeight="2.5rem">
        {`<${label}>`}:
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

  return (
    <>
      <Button onClick={downloadHex} leftIcon={<Icon as={IoIosDownload} />}>
        Download Hex
      </Button>

      <Box
        display="grid"
        gridTemplateColumns="minmax(8rem, 10rem) minmax(12rem, 1.1fr) 1fr minmax(2.75rem, 3.25rem)"
        columnGap={4}
        marginTop={4}
        w="100%"
        alignItems="stretch"
        fontFamily="mono"
        letterSpacing="tight"
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        <Box display="flex" alignItems="flex-end" pb={2} borderBottomWidth="1px" borderColor="gray.200">
          <Text color="blue.500" fontWeight="bold" fontSize="sm">
            Address
          </Text>
        </Box>
        <Box display="flex" alignItems="flex-end" pb={2} borderBottomWidth="1px" borderColor="gray.200">
          <Text color="pink.400" fontWeight="bold" fontSize="sm">
            Bytecode
          </Text>
        </Box>
        <Box display="flex" alignItems="flex-end" pb={2} borderBottomWidth="1px" borderColor="gray.200">
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

        {program.map((inst, idx) => {
          const curLabels = labelsByAddr[inst.address.toString()];

          return (
            <>
              {curLabels
                ? curLabels.map((l) => <LabelDisplay key={l + inst.address} address={inst.address} label={l} />)
                : null}

              <HexDisplay key={idx} inst={inst} simulator={simulator} />
            </>
          );
        })}
      </Box>
    </>
  );
}

export default memo(HexView);
