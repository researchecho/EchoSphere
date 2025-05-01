import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { fadeIn, staggerContainer } from "@/lib/animations";

// Video chapters
const videoChapters = [
  { time: "0:00", title: "Introduction" },
  { time: "1:25", title: "Website Setup" },
  { time: "4:10", title: "E-Commerce Integration" },
  { time: "7:30", title: "AI Configuration" },
  { time: "10:15", title: "Results & Analytics" }
];

export default function DemoVideoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  return (
    <section id="demo" className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute right-[20%] top-[30%] w-[40%] h-[40%] rounded-full bg-primary-400/10 dark:bg-primary-900/10 blur-[100px]"></div>
        <div className="absolute left-[10%] bottom-[20%] w-[30%] h-[30%] rounded-full bg-purple-400/10 dark:bg-purple-900/10 blur-[100px]"></div>
      </div>
      
      <motion.div 
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <motion.div 
          variants={fadeIn("up", "tween", 0.2, 1)}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
            See <span className="text-gradient">Echoverse</span> in Action
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Watch how our AI-native platform transforms the way you build and manage your digital presence.
          </p>
        </motion.div>
        
        <motion.div 
          variants={fadeIn("up", "tween", 0.4, 1)}
          className="relative max-w-5xl mx-auto"
        >
          {/* Video Player Container */}
          <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Video Thumbnail */}
            <div className="aspect-video bg-black relative">
              <img 
                src="https://images.unsplash.com/photo-1633419461186-7d40a38105ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80" 
                className="w-full h-full object-cover opacity-80"
                alt="Echoverse Demo Video Thumbnail" 
              />
              
              {/* Play Button */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform transition-transform hover:scale-110">
                  <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center">
                    <i className="ri-play-fill text-white text-3xl"></i>
                  </div>
                </button>
              </motion.div>
              
              {/* Video Title Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-4">
                  <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <h3 className="text-white font-medium">Building a Complete Business Platform with Echoverse</h3>
                  </div>
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm text-white">
                    12:45
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Video Description */}
          <motion.div
            variants={fadeIn("up", "tween", 0.6, 1)} 
            className="mt-8 text-center"
          >
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This demo shows how to build a complete business platform from scratch using Echoverse's AI-powered modules.
            </p>
            
            {/* Video Chapters */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {videoChapters.map((chapter, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  {chapter.time} {chapter.title}
                </motion.div>
              ))}
            </div>
            
            {/* More Videos Link */}
            <Button
              variant="outline"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-colors"
            >
              View More Tutorials <i className="ri-arrow-right-line ml-2"></i>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
