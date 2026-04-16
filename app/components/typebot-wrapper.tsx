'use client';

import dynamic from 'next/dynamic';

const TypebotBubble = dynamic(() => import('./typebotbubble'), { ssr: false });

export default function TypebotWrapper() {
  return <TypebotBubble />;
}
