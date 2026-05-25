import { Badge, Divider, Flex, Heading, useColorModeValue } from '@chakra-ui/react';
import { Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table';
import {} from '@monaco-editor/react';
import Markdown from 'react-markdown';
import { useSimulator } from '../../../hooks/simulator.hook';

export default function InstructionManual() {
  const { simulator } = useSimulator();

  const regColors = ['green', 'red', 'cyan', 'gray', 'purple', 'yellow'];
  const calcRegColor = (kind: string) => regColors[kind.charCodeAt(0) % regColors.length];

  return (
    <>
      <Heading style={{ marginTop: 10, marginBottom: 20 }} size="md">
        {simulator.name} Instruction Set
      </Heading>

      <Flex gap={2} style={{ marginBottom: 10 }}>
        <Heading size="sm">Registers:</Heading>

        {simulator.manual.registers.map((reg) => (
          <Badge key={reg.name} colorScheme={calcRegColor(reg.kind)}>
            {reg.alias || reg.name}
          </Badge>
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
