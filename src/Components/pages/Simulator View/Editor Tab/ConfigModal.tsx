import {
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import React from 'react';
import { useSimulator } from '../../../../hooks/simulator.hook';
import SharedData from '../../../../Service/SharedData';

export default function ConfigModal(props: { isOpen: boolean; close: Function }) {
  const { simulator } = useSimulator();
  const share: SharedData = SharedData.instance;
  const [clockSpeed, setClockSpeed] = React.useState<number>(simulator.processor.frequency);
  const { colorMode, toggleColorMode } = useColorMode();

  function clockSpeedChange(e: any) {
    let speed = Number(e.target.value);
    if (isNaN(speed)) return;

    if (speed > 10000) speed = 10000;
    else if (speed <= 0) speed = 1;

    setClockSpeed(speed);
    simulator.setFrequency(speed);
  }

  return (
    <Modal isOpen={props.isOpen} onClose={() => props.close()}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Configuration</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack direction="column" spacing={2}>
            <Flex>
              <Text>Clock speed (Hz)</Text>
              <Input
                onChange={clockSpeedChange}
                value={clockSpeed}
                style={{ width: '80px', marginLeft: 10, alignSelf: 'center' }}
                max="10000"
                min="1"
                placeholder="10"
                size="xs"
              />
            </Flex>

            <Button
              style={{ marginTop: '24px' }}
              onClick={() => {
                toggleColorMode();
                share.updateCached('theme-data', colorMode == 'dark' ? 'light' : 'dark');
              }}
            >
              Toggle {colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={() => props.close()}>
            Close
          </Button>
          <Button variant="ghost">Reset</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
