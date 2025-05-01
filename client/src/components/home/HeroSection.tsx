import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const textOptions = [
    "Website Building",
    "E-Commerce",
    "Social Networking",
    "Educational Content",
    "Marketing Automation"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % textOptions.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="pt-32 pb-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 180],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -right-[20%] top-[5%] w-[70%] h-[70%] rounded-full bg-gradient-conic from-primary-600/30 via-purple-600/30 to-pink-600/30 dark:from-primary-400/20 dark:via-purple-400/20 dark:to-pink-400/20 blur-[120px]"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute -left-[10%] top-[20%] w-[40%] h-[40%] rounded-full bg-primary-400/20 dark:bg-primary-900/20 blur-[100px]"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.6 }}
          className="absolute right-[20%] bottom-[10%] w-[30%] h-[30%] rounded-full bg-secondary-400/20 dark:bg-secondary-900/20 blur-[100px]"
        />
      </div>
      
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1 
            variants={fadeIn("up", "tween", 0.2, 1)}
            className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl leading-tight mb-6"
          >
            The <span className="text-gradient">AI-Native</span> Platform for{" "}
            <span className="relative inline-block">
              <motion.span
                key={currentTextIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="js-text-rotation inline"
              >
                {textOptions[currentTextIndex]}
              </motion.span>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500 rounded-full"></div>
            </span>
          </motion.h1>
          
          <motion.p
            variants={fadeIn("up", "tween", 0.4, 1)}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Echoverse combines the power of AI with a modular SaaS ecosystem to help you build, manage, and grow your digital presence — all in one platform.
          </motion.p>
          
          <motion.div
            variants={fadeIn("up", "tween", 0.6, 1)}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
          >
            <Button
              size="lg"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 text-white font-medium text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:from-primary-500 hover:via-purple-500 hover:to-pink-500"
            >
              Get Started <i className="ri-arrow-right-line ml-2"></i>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 font-medium text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <i className="ri-play-circle-line mr-2 text-primary-600 dark:text-primary-400"></i> Watch Demo
            </Button>
          </motion.div>
        </div>
        
        {/* Hero Image/Showcase */}
        <motion.div
          variants={fadeIn("up", "tween", 0.8, 1)}
          className="relative mt-10 mb-16"
        >
          <div className="w-full h-full absolute -top-10 left-0 flex justify-center">
            <div className="w-full max-w-4xl h-20 bg-gradient-to-r from-primary-600/20 via-purple-600/20 to-secondary-600/20 blur-3xl rounded-full"></div>
          </div>
          
          <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 glass">
            <img 
              src="https://images.unsplash.com/photo-1642132652806-8c4662ee6b3a?auto=format&fit=crop&q=80&w=2960&ixlib=rb-4.0.3"
              alt="Echoverse AI Dashboard" 
              className="w-full h-auto object-cover rounded-t-xl" 
            />
            
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              <div className="bg-black/70 backdrop-blur-sm py-3 px-6 rounded-full flex items-center gap-3 text-white text-sm font-medium">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>AI actively learning from your business needs</span>
              </div>
            </div>
          </div>
          
          {/* Floating badges */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 1.2,
              type: "spring",
              stiffness: 100,
            }}
            className="absolute -right-4 top-1/3 transform translate-x-1/2 animate-float hidden md:block"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <i className="ri-robot-line text-green-600 dark:text-green-400"></i>
                </div>
                <div>
                  <div className="text-xs font-semibold">AI Generated</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Perfect SEO Content</div>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 1.5,
              type: "spring",
              stiffness: 100,
            }}
            className="absolute -left-4 top-1/4 transform -translate-x-1/2 animate-float hidden md:block"
            style={{ animationDelay: "1s" }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <i className="ri-image-line text-purple-600 dark:text-purple-400"></i>
                </div>
                <div>
                  <div className="text-xs font-semibold">Design Ready</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Visual Builder</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Trusted by */}
        <motion.div 
          variants={fadeIn("up", "tween", 1, 1)}
          className="mt-16 text-center"
        >
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">TRUSTED BY INNOVATIVE TEAMS AT</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-70 dark:opacity-50">
            {/* Company logos */}
            <div className="h-8 flex items-center">
              <i className="ri-microsoft-fill text-3xl"></i>
              <span className="ml-1 text-lg font-semibold">Microsoft</span>
            </div>
            <div className="h-8 flex items-center">
              <i className="ri-amazon-fill text-3xl"></i>
              <span className="ml-1 text-lg font-semibold">Amazon</span>
            </div>
            <div className="h-8 flex items-center">
              <i className="ri-netflix-fill text-3xl"></i>
              <span className="ml-1 text-lg font-semibold">Netflix</span>
            </div>
            <div className="h-8 flex items-center">
              <i className="ri-apple-fill text-3xl"></i>
              <span className="ml-1 text-lg font-semibold">Apple</span>
            </div>
            <div className="h-8 flex items-center">
              <i className="ri-spotify-fill text-3xl"></i>
              <span className="ml-1 text-lg font-semibold">Spotify</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
