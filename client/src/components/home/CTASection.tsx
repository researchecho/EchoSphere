import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { fadeIn, staggerContainer } from "@/lib/animations";

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 to-purple-600/90 opacity-90"></div>
        {/* Animated circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-white opacity-10"
          ></motion.div>
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.15, 0.1],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 6,
              delay: 1,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute top-[50%] -right-[10%] w-[30%] h-[30%] rounded-full bg-white opacity-10"
          ></motion.div>
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 8,
              delay: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute -bottom-[10%] left-[30%] w-[25%] h-[25%] rounded-full bg-white opacity-10"
          ></motion.div>
        </div>
      </div>
      
      <motion.div 
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            variants={fadeIn("up", "tween", 0.2, 1)}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 font-heading"
          >
            Ready to Transform Your Digital Presence?
          </motion.h2>
          <motion.p 
            variants={fadeIn("up", "tween", 0.3, 1)}
            className="text-xl text-white/90 mb-10 max-w-3xl mx-auto"
          >
            Join thousands of businesses using Echoverse to build, grow, and manage their online platforms with the power of AI.
          </motion.p>
          
          <motion.div 
            variants={fadeIn("up", "tween", 0.4, 1)}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white text-primary-600 font-medium text-lg transition-transform hover:scale-105 hover:shadow-lg"
            >
              Start Free Trial <i className="ri-arrow-right-line ml-2"></i>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white/10 text-white border border-white/20 backdrop-blur-sm font-medium text-lg hover:bg-white/20 transition-colors"
            >
              <i className="ri-calendar-line mr-2"></i> Schedule Demo
            </Button>
          </motion.div>
          
          <motion.div 
            variants={fadeIn("up", "tween", 0.5, 1)}
            className="mt-8 text-white/80 text-sm"
          >
            No credit card required. 14-day free trial. Cancel anytime.
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
