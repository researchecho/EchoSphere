import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
  benefits: string[];
  iconBgClass: string;
  iconTextClass: string;
  linkTextClass: string;
  hoverTextClass: string;
};

export default function FeatureCard({
  icon,
  title,
  description,
  benefits,
  iconBgClass,
  iconTextClass,
  linkTextClass,
  hoverTextClass
}: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        y: -5,
        backgroundColor: "var(--hover-card-bg, rgba(255,255,255,0.8))",
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-primary-400/10 transition-all duration-300"
    >
      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-6", iconBgClass)}>
        <i className={cn(icon, "text-2xl", iconTextClass)}></i>
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {description}
      </p>
      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-center">
            <i className="ri-check-line text-green-500 mr-2"></i>
            {benefit}
          </li>
        ))}
      </ul>
      <a href="#" className={cn("inline-flex items-center font-medium", linkTextClass, hoverTextClass)}>
        Learn more <i className="ri-arrow-right-line ml-1"></i>
      </a>
    </motion.div>
  );
}