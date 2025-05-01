import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import FeatureCard from "@/components/ui/FeatureCard";
import { fadeIn, staggerContainer } from "@/lib/animations";

const features = [
  {
    id: 1,
    icon: "ri-layout-4-line",
    title: "Website Builder + CMS",
    description: "Create stunning websites with AI-powered design suggestions and content generation.",
    benefits: [
      "Drag-and-drop interface",
      "AI-generated content",
      "SEO optimization built-in"
    ],
    iconBgClass: "bg-primary-100 dark:bg-primary-900/30",
    iconTextClass: "text-primary-600 dark:text-primary-400",
    linkTextClass: "text-primary-600 dark:text-primary-400",
    hoverTextClass: "hover:text-primary-700 dark:hover:text-primary-300"
  },
  {
    id: 2,
    icon: "ri-shopping-bag-3-line",
    title: "E-Commerce Engine",
    description: "Sell products and services with intelligent inventory and customer management.",
    benefits: [
      "Stripe integration",
      "Smart product recommendations",
      "Automated inventory management"
    ],
    iconBgClass: "bg-purple-100 dark:bg-purple-900/30",
    iconTextClass: "text-purple-600 dark:text-purple-400",
    linkTextClass: "text-purple-600 dark:text-purple-400",
    hoverTextClass: "hover:text-purple-700 dark:hover:text-purple-300"
  },
  {
    id: 3,
    icon: "ri-group-line",
    title: "Social Network + Messaging",
    description: "Build communities with integrated social features and real-time messaging.",
    benefits: [
      "User groups and forums",
      "Direct and group messaging",
      "Content moderation AI"
    ],
    iconBgClass: "bg-secondary-100 dark:bg-secondary-900/30",
    iconTextClass: "text-secondary-600 dark:text-secondary-400",
    linkTextClass: "text-secondary-600 dark:text-secondary-400",
    hoverTextClass: "hover:text-secondary-700 dark:hover:text-secondary-300"
  },
  {
    id: 4,
    icon: "ri-book-open-line",
    title: "Educational Portal",
    description: "Create and manage courses with AI-generated learning materials and tests.",
    benefits: [
      "Lesson builder with AI assistance",
      "Kids mode with parental controls",
      "Progress tracking and analytics"
    ],
    iconBgClass: "bg-red-100 dark:bg-red-900/30",
    iconTextClass: "text-red-600 dark:text-red-400",
    linkTextClass: "text-red-600 dark:text-red-400",
    hoverTextClass: "hover:text-red-700 dark:hover:text-red-300"
  },
  {
    id: 5,
    icon: "ri-customer-service-2-line",
    title: "CRM + Marketing",
    description: "Manage customer relationships and create targeted marketing campaigns.",
    benefits: [
      "Contact management",
      "AI-powered email campaigns",
      "SEO and Ad management"
    ],
    iconBgClass: "bg-amber-100 dark:bg-amber-900/30",
    iconTextClass: "text-amber-600 dark:text-amber-400",
    linkTextClass: "text-amber-600 dark:text-amber-400",
    hoverTextClass: "hover:text-amber-700 dark:hover:text-amber-300"
  },
  {
    id: 6,
    icon: "ri-store-2-line",
    title: "Marketplace",
    description: "Access plugins, templates, and AI agents to enhance your platform.",
    benefits: [
      "Custom plugins and extensions",
      "Professional templates",
      "Specialized AI agents"
    ],
    iconBgClass: "bg-blue-100 dark:bg-blue-900/30",
    iconTextClass: "text-blue-600 dark:text-blue-400",
    linkTextClass: "text-blue-600 dark:text-blue-400",
    hoverTextClass: "hover:text-blue-700 dark:hover:text-blue-300"
  }
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  
  return (
    <section id="features" className="py-20 bg-gray-100 dark:bg-gray-800/50 relative">
      <motion.div 
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <motion.div 
          variants={fadeIn("up", "tween", 0.2, 1)}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
            All-in-One <span className="text-gradient">Platform</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to build, grow, and manage your digital presence — powered by advanced AI.
          </p>
        </motion.div>
        
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 [&>*:hover]:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              variants={fadeIn("up", "tween", 0.2 + index * 0.1, 1)}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                benefits={feature.benefits}
                iconBgClass={feature.iconBgClass}
                iconTextClass={feature.iconTextClass}
                linkTextClass={feature.linkTextClass}
                hoverTextClass={feature.hoverTextClass}
              />
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          variants={fadeIn("up", "tween", 0.8, 1)}
          className="mt-16 text-center"
        >
          <a href="#" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-colors">
            View All Features <i className="ri-arrow-right-line ml-2"></i>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
