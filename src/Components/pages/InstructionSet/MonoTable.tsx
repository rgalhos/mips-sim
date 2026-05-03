import { Badge, Flex, Heading, useColorModeValue } from '@chakra-ui/react';
import { Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table';
import { useSimulator } from '../../../hooks/simulator.hook';

export default function MonoTable() {
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
          <Badge colorScheme={calcRegColor(reg.kind)}>{reg.alias || reg.name}</Badge>
        ))}
      </Flex>
      <TableContainer>
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
            {simulator.manual.instructions.map((x) => {
              return (
                <Tr>
                  <Td>{x.name}</Td>
                  <Td>{x.operation}</Td>
                  <Td>{x.description}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}
