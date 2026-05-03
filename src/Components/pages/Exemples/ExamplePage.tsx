import { Button, Card, CardBody, Grid, GridItem, Text } from '@chakra-ui/react';
import Editor from '@monaco-editor/react';
import SharedData from '../../../Service/SharedData';
import { useSimulator } from '../../../hooks/simulator.hook';
import { useEffect, useState } from 'react';
import { IManualExample } from '../../../hardware/common/examples';

function loadExample(code: string) {
  SharedData.instance.code = code;
  SharedData.instance.changePage(0);
}

function Example(props: { title: string; code: string; fsize?: number }) {
  return (
    <Card>
      <CardBody>
        <Text style={{ paddingBottom: 10 }}>{props.title}</Text>
        <Editor
          defaultLanguage="mips"
          defaultValue={props.code}
          theme="mipsdark"
          height="200px"
          options={{
            scrollBeyondLastLine: false,
            fontSize: props.fsize || 16,
            readOnly: true,
          }}
        />
        <Button style={{ marginTop: 10 }} onClick={loadExample}>
          Load
        </Button>
      </CardBody>
    </Card>
  );
}

export default function ExamplePage() {
  const { simulator } = useSimulator();
  const [examples, setExamples] = useState<IManualExample[]>([]);

  useEffect(() => {
    simulator.examples().then((exmpl) => {
      setExamples(exmpl);
    });
  }, [simulator]);

  return (
    <div style={{ height: '110vh' }}>
      <h1 style={{ fontSize: 30, marginLeft: 5, paddingBottom: 10 }}>Examples</h1>
      <Grid templateColumns="repeat(2, 1fr)" gap={6} rowGap={60}>
        {examples.map((example, i) => (
          <GridItem key={'example' + i} w="100%" h="100">
            <Example title={example.name} code={example.code} />
          </GridItem>
        ))}
      </Grid>
    </div>
  );
}
