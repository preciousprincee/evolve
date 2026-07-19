import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { messageBubbleIn } from '../animations/variants.js';

export function MessageBubble({ role, content, isStreaming }) {
  const isUser = role === 'user';

  return (
    <motion.div
      variants={messageBubbleIn}
      initial="hidden"
      animate="visible"
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          isUser
            ? 'bg-aurora-gradient text-void font-medium rounded-br-md'
            : 'glass-panel-solid text-ink-primary rounded-bl-md'
        }`}
      >
        <div className="prose prose-invert prose-sm max-w-none [&_p]:my-0 [&_p+p]:mt-2">
          <ReactMarkdown>{content || ' '}</ReactMarkdown>
        </div>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-current ml-0.5 align-middle animate-pulse" aria-hidden="true" />
        )}
      </div>
    </motion.div>
  );
}
