import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
    return (
        <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[28px] shadow-sm relative overflow-hidden group"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20 text-current`}>
                    <Icon size={20} className={color.replace('bg-', 'text-')} strokeWidth={2.5} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                        <TrendingUp size={12} />
                        +{trend}%
                    </div>
                )}
            </div>
            
            <div className="space-y-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
                    {title}
                </h3>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
            </div>

            {/* Background Accent Decorative */}
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-700 ${color.replace('bg-', 'text-')}`}>
                <Icon size={120} strokeWidth={1} />
            </div>
        </motion.div>
    );
};

export default StatsCard;
