'use client';
import React from 'react';
import {
  SandpackProvider,
  SandpackLayout,
} from '@codesandbox/sandpack-react';

import Lookup from '@/data/Lookup';
import SandpackPreviewClient from './SandpackPreviewClient';

function Previewview({ files }) {
  return (
    <SandpackProvider
      files={files}
      template="react"
      theme="dark"
      customSetup={{
        dependencies: {
          ...Lookup.DEPENDANCY,
        },
      }}
      options={{ externalResources: ['https://cdn.tailwindcss.com'] }}
    >
      <SandpackLayout>
        <SandpackPreviewClient />
      </SandpackLayout>
    </SandpackProvider>
  );
}

export default Previewview;