'use client';

import { useAppStore } from '../store/useAppStore';
import { Card, CardContent } from './ui/card';
import { Brain, ShieldCheck, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function IntelligenceStats() {
  const { safetyScore } = useAppStore();

  const stats = [
    { label: 'Safety Index', value: `${safetyScore}%`, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'AI Confidence', value: '98.4%', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'System Latency', value: '142ms', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Predictive Accuracy', value: '91%', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="border-slate-200 shadow-md bg-white hover:border-primary/50 transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} border border-slate-100 flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{stat.label}</span>
                <span className="text-lg font-black text-slate-800">{stat.value}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
