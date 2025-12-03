'use client';

import React, { useContext, useEffect, useRef } from 'react';
import { SandpackPreview, useSandpack } from '@codesandbox/sandpack-react';
import { ActionContext } from '@/context/ActionContext';

function SandpackPreviewClient() {
  const previewRef = useRef(null);
  const { sandpack } = useSandpack();
  const { action } = useContext(ActionContext);

  useEffect(() => {
    if (!previewRef.current || !action) return;

    const run = async () => {
      try {
        // getClient itself can return null if the preview isn't ready yet
        const client = previewRef.current.getClient
          ? previewRef.current.getClient()
          : null;

        if (!client || !client.getCodeSandboxURL) {
          console.log('Sandpack client not ready yet');
          return;
        }

        const result = await client.getCodeSandboxURL();

        console.log('Sandpack URL result:', result);

        if (!result) return;

        if (action.actionType === 'deploy') {
          window.open(`https://${result.sandboxId}.csb.app/`, '_blank');
        } else if (action.actionType === 'export') {
          window.open(result.editorUrl, '_blank');
        }
      } catch (error) {
        console.error('Error in GetSandpackClient:', error);
      }
    };

    run();
  }, [sandpack?.status, action]); // run again when status/action change

  return (
    <SandpackPreview
      ref={previewRef}
      showNavigator
      style={{ height: '80vh' }}
    />
  );
}

export default SandpackPreviewClient;