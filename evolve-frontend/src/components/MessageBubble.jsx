import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { messageBubbleIn } from '../animations/variants.js';

const dotTransition = (delay) => ({
  y: [0, -4, 0],
  transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay },
});

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5" aria-label="Evolve is typing">
      <motion.span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" animate={dotTransition(0)} />
      <motion.span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" animate={dotTransition(0.15)} />
      <motion.span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" animate={dotTransition(0.3)} />
    </span>
  );
}

export function MessageBubble({ role, content, isStreaming }) {
  const isUser = role === 'user';
  // While waiting for the first token, show a standalone typing indicator
  // instead of an empty bubble with a floating ellipsis below it — reads
  // much closer to iMessage/WhatsApp and avoids an awkward empty gap.
  const isWaitingForFirstToken = isStreaming && content.trim().length === 0;

  return (
    <motion.div
      layout="position"
      variants={messageBubbleIn}
      initial="hidden"
      animate="visible"
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <motion.div
        layout
        transition={{ layout: { duration: 0.2, ease: 'easeOut' } }}
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          isUser
            ? 'bg-aurora-gradient text-void font-medium rounded-br-md'
            : 'glass-panel-solid text-ink-primary rounded-bl-md'
        }`}
      >
        {isWaitingForFirstToken ? (
          <TypingDots />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none [&_p]:my-0 [&_p+p]:mt-2">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
