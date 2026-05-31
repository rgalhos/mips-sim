import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import SharedData from '../../../../Service/SharedData';

export default function LoadProgramModal(props: { isOpen: boolean; close: () => void }) {
  const share = SharedData.instance;

  function loadFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (!target.files?.length) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        share.code = content;
        share.updateMonacoCode();
        props.close();
      };

      reader.readAsText(target.files[0]);
    };

    input.click();
  }

  return (
    <Modal isOpen={props.isOpen} onClose={props.close}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Load Program</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Import assembly code from a .txt file. Your current editor content is saved automatically.</Text>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={loadFromFile}>
            From File
          </Button>
          <Button onClick={props.close}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
