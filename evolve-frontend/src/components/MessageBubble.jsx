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
        <ReactMarkdown>{content || ''}</ReactMarkdown>

        {isStreaming && (
          <span className="inline-flex items-center gap-1 ml-2 align-middle">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-current"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  y: [0, -2, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </span>
        )}
      </div>
    </motion.div>
  );
}