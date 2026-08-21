'use client';

import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

export const foundationCapabilities = [
  ['Web', 'Next.js + Framer Motion'],
  ['Services', 'NestJS API + worker'],
  ['Boundaries', 'Runtime-validated'],
] as const;

export function FoundationStatus() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="status-grid" aria-label="Phase 0 foundation status">
      {foundationCapabilities.map(([label, value], index) => (
        <motion.div
          className="status-card"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reducedMotion ? 0 : index * 0.08 }}
          key={label}
        >
          <strong>{label}</strong>
          <span>{value}</span>
        </motion.div>
      ))}
    </div>
  );
}
