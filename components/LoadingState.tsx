import React from 'react';
import { motion } from 'framer-motion';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-6">
      <div className="flex space-x-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-6 h-6 rounded-full"
            style={{ 
              backgroundColor: i === 0 ? '#60a5fa' : i === 1 ? '#facc15' : '#f87171' 
            }}
            animate={{
              y: [-10, 10, -10],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      <motion.p 
        className="text-lg text-slate-500 font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        正在构建思维支架... (Constructing Scaffolding...)
      </motion.p>
    </div>
  );
};
