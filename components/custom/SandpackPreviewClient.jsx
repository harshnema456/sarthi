'use client';
import { ActionContext } from '@/context/ActionContext';
import { SandpackPreview, useSandpack } from '@codesandbox/sandpack-react';
import React, { useContext, useEffect, useRef } from 'react';
// SandpackPreviewClient component
function SandpackPreviewClient() {
  const previewRef = useRef();
  const { sandpack } = useSandpack();
    const { action, setAction } = useContext(ActionContext);
  // effect to handle deploy/export actions
  useEffect(() => {
    GetSandpackCleint();
  }, [sandpack&& action]);
  const GetSandpackCleint = async () => {
    const client = previewRef.current?.getClient();
    if (client) {
      console.log(client);
      const result = await client.getCodeSandboxURL();
      if(action?.actionType == "deploy") {
        window.open('https://' + result?.sandboxId + ".csb.app/")
      } else if(action?.actionType == "export") {
        window?.open(result?.editorUrl)
      } // handle deploy/export based on action type
    }
  };
// render SandpackPreview component
  return (
    <SandpackPreview
      ref={previewRef}
      showNavigator={true}
      style={{ height: '80vh' }}
    />
  );
}

export default SandpackPreviewClient;
