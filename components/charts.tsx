import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { RelationshipTier } from '../types';

interface ChartProps {
  data: { name: string; value: number; tier: RelationshipTier }[];
}

const COLORS = ['#94a3b8', '#60a5fa', '#818cf8', '#a78bfa', '#f472b6']; // Slate, Blue, Indigo, Violet, Pink

export const TierDistributionChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.8)', 
              borderRadius: '12px', 
              border: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }} 
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};