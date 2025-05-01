import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navbarClasses = cn(
    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
    scrolled && "glass shadow-sm border-b border-gray-200 dark:border-gray-700"
  );

  const mobileMenuClasses = cn(
    "md:hidden transition-all duration-300 glass absolute w-full",
    isMobileMenuOpen ? "block" : "hidden"
  );

  return (
    <header className={navbarClasses}>
      <nav className="flex items-center justify-between p-4 lg:px-8 mx-auto max-w-7xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-glow">
              <i className="ri-bubble-chart-fill text-white text-xl"></i>
            </div>
            <span className="text-xl font-bold font-heading">Echoverse</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            <a href="#features" className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
            <a href="#ai-omnilayer" className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">AI Omnilayer</a>
            <a href="#modules" className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Modules</a>
            <a href="#pricing" className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</a>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <div className="hidden sm:flex gap-3 items-center">
            <Link href="#" className="text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2">Log in</Link>
            <Link href="#">
              <Button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md">
                Get Started
              </Button>
            </Link>
          </div>
          
          <button 
            className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            onClick={toggleMobileMenu}
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
        </div>
      </nav>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className={mobileMenuClasses}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 flex flex-col">
              <a href="#features" className="px-3 py-2 rounded-md text-base font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
              <a href="#ai-omnilayer" className="px-3 py-2 rounded-md text-base font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">AI Omnilayer</a>
              <a href="#modules" className="px-3 py-2 rounded-md text-base font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Modules</a>
              <a href="#pricing" className="px-3 py-2 rounded-md text-base font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</a>
              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Link href="#" className="w-full text-center bg-gray-200 dark:bg-gray-800 py-2 rounded-lg text-sm font-medium">Log in</Link>
                <Link href="#" className="w-full text-center bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
