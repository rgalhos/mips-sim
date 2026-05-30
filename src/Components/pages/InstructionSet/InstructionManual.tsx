import { Badge, Divider, Flex, Heading, Tooltip, useColorModeValue } from '@chakra-ui/react';
import { Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table';
import {} from '@monaco-editor/react';
import Markdown from 'react-markdown';
import { useSimulator } from '../../../hooks/simulator.hook';

export default function InstructionManual() {
  const { simulator } = useSimulator();

  function calcRegColor(kind: string) {
    return (
      {
        constant: 'gray',
        pointer: 'purple',
        temporary: 'red',
        saved: 'green',
        argument: 'cyan',
      }[kind as string] || 'gray'
    );
  }

  return (
    <>
      <Heading style={{ marginTop: 10, marginBottom: 20 }} size="md">
        {simulator.name} Instruction Set
      </Heading>

      <Heading size="sm">Registers:</Heading>
      <Flex
        display="grid"
        gridTemplateColumns="repeat(32, fit-content(100%))"
        textAlign="center"
        userSelect="none"
        gap={2}
        my={2}
      >
        {simulator.manual.registers.map((reg) => (
          <Tooltip key={reg.name} label={<Markdown>{reg.description}</Markdown>}>
            <Badge colorScheme={calcRegColor(reg.kind)}>{reg.alias || reg.name}</Badge>
          </Tooltip>
        ))}
      </Flex>

      <TableContainer sx={{ whiteSpace: 'pre-line', maxWidth: '1280px' }}>
        <Table
          variant="simple"
          style={{
            backgroundColor: useColorModeValue('white', 'gray.900'),
            borderRadius: 10,
            boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.1)',
          }}
        >
          <Thead>
            <Tr>
              <Th>Instruction</Th>
              <Th>Operation</Th>
              <Th>Description</Th>
            </Tr>
          </Thead>
          <Tbody>
            {simulator.manual.instructions.map((inst) => {
              return (
                <Tr key={inst.name}>
                  <Td>{inst.name}</Td>
                  <Td>{inst.operation}</Td>
                  <Td>
                    <Markdown>{inst.description}</Markdown>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>

      <TableContainer sx={{ whiteSpace: 'pre-line', maxWidth: '1280px', marginTop: '60px' }}>
        <Table
          variant="simple"
          style={{
            backgroundColor: useColorModeValue('white', 'gray.900'),
            borderRadius: 10,
            boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.1)',
          }}
        >
          <Thead>
            <Tr>
              <Th>Constant</Th>
              <Th>Description</Th>
            </Tr>
          </Thead>
          <Tbody>
            {simulator.manual.consts.map((c) => (
              <Tr key={c.name}>
                <Td>{c.name}</Td>
                <Td>
                  <Markdown>{c.description}</Markdown>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}
