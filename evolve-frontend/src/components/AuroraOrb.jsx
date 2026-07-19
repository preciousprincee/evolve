import React from 'react';
import { motion } from 'framer-motion';
import { orbBreathe } from '../animations/variants.js';

// The signature visual: a living, slowly breathing gradient orb representing
// the companion. Used on Home (large, ambient background) and small in
// headers/avatars elsewhere for continuity.
export function AuroraOrb({ size = 220, className = '' }) {
  return (
    <motion.div
      variants={orbBreathe}
      animate="animate"
      className={`rounded-full bg-aurora-gradient blur-2xl ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
