'use client';

import { Bubble } from '@typebot.io/react';

export default function TypebotBubble() {
  return (
    <>
      <Bubble
        typebot="correaelaiaadvocacia"
        apiHost="https://typebot.io"
        theme={{
          button: {
            backgroundColor: '#26d466',
            size: 'large',
            borderRadius: '9999px',
          },
        }}
      />
    </>
  );
}
