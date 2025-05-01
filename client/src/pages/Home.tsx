import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import AIOmnilayerSection from "@/components/home/AIOmnilayerSection";
import ModulesShowcase from "@/components/home/ModulesShowcase";
import DemoVideoSection from "@/components/home/DemoVideoSection";
import PricingSection from "@/components/home/PricingSection";
import CTASection from "@/components/home/CTASection";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

export default function Home() {
  const { theme } = useTheme();
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="font-sans text-gray-900 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar />
      
      <main>
        <HeroSection />
        <FeaturesSection />
        <AIOmnilayerSection />
        <ModulesShowcase />
        <DemoVideoSection />
        <PricingSection />
        <CTASection />
      </main>
      
      <Footer />
      
      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              className="rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg"
            >
              <i className="ri-arrow-up-line text-xl"></i>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
