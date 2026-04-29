import { Stack } from "@chakra-ui/react";
import React from "react";
import AssemblyEditor from "../../../AssemblyEditor";

export default function EditorView(props: {
  onEditorChange: (value: string | undefined, event: any) => void;
}) {
  return (
    <Stack direction={"row"}>
      <AssemblyEditor onEditorChange={props.onEditorChange} />
    </Stack>
  );
}
