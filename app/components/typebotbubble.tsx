'use client';

import { Bubble } from '@typebot.io/react';

export default function TypebotBubble() {
  return (
    <>
      <Bubble
        typebot="correia-e-laia-lp-trabalhista-a-b-kb9c7vg"
        apiHost="https://typebot.io"
        previewMessage={{
          message: 'Entre em contato conosco!',
          autoShowDelay: 1000,
        }}
        theme={{
          button: { backgroundColor: '#26d466', size: 'large', borderRadius: '9999px' },
          previewMessage: {
            backgroundColor: '#26d466',
            textColor: '#FFFFFF',
            closeButtonIconColor: '#666460',
          },
        }}
      />
    </>
  );
}
