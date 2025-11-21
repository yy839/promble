
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Quote } from 'lucide-react';

interface Props {
  content: string;
}

export const ScenarioCard: React.FC<Props> = ({ content }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-amber-50/50 border border-amber-100 rounded-xl p-6 relative overflow-hidden group"
    >
      {/* Decorative Elements */}
      <Quote className="absolute top-4 left-4 text-amber-200/50 w-16 h-16 -z-0 rotate-12" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3 text-amber-700 font-bold text-sm uppercase tracking-wider">
          <BookOpen size={16} />
          <span>场景重现 (Scenario Immersion)</span>
        </div>
        
        <p className="text-slate-800 text-lg leading-relaxed font-serif italic text-justify">
          {content}
        </p>
      </div>
      
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-amber-100/30 to-transparent rounded-tl-full" />
    </motion.div>
  );
};
