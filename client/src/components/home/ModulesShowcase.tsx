import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Module data
const modules = [
  {
    id: "website-builder",
    label: "Website Builder",
    title: "Website Builder + CMS",
    description: "Create stunning websites with our AI-powered drag-and-drop builder. The integrated CMS makes content management effortless with automated SEO optimization.",
    features: [
      {
        title: "Drag-and-Drop Builder",
        description: "Visual interface for creating beautiful layouts without code"
      },
      {
        title: "AI Content Generation",
        description: "Create compelling copy and content with just a prompt"
      },
      {
        title: "Integrated Blog Engine",
        description: "Powerful blogging tools with categories, tags, and scheduling"
      },
      {
        title: "SEO Optimization",
        description: "Automated SEO tools that boost your search rankings"
      }
    ],
    image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2670&q=80",
    badgeText: "AI Generated",
    badgeSubtext: "10 pages created",
    templateType: "E-commerce Store",
    buttonColor: "bg-primary-600 hover:bg-primary-700",
    buttonText: "Explore Website Builder"
  },
  {
    id: "e-commerce",
    label: "E-Commerce",
    title: "E-Commerce Engine",
    description: "Launch your online store with our powerful e-commerce module featuring product management, cart functionality, and Stripe checkout integration.",
    features: [
      {
        title: "Product Management",
        description: "Easily add, categorize and manage your product inventory"
      },
      {
        title: "Secure Checkout",
        description: "Seamless Stripe integration for secure payments"
      },
      {
        title: "AI Product Recommendations",
        description: "Boost sales with intelligent cross-selling suggestions"
      },
      {
        title: "Inventory Management",
        description: "Automated stock tracking and low inventory alerts"
      }
    ],
    image: "https://images.unsplash.com/photo-1661956601349-f61c959a8fd4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2671&q=80",
    buttonColor: "bg-purple-600 hover:bg-purple-700",
    buttonText: "Explore E-Commerce"
  },
  {
    id: "social-network",
    label: "Social Network",
    title: "Social Network + Community",
    description: "Build thriving communities with integrated social features including profiles, timelines, messaging, and content creation tools.",
    features: [
      {
        title: "User Profiles",
        description: "Customizable user profiles with activity feeds"
      },
      {
        title: "Groups & Forums",
        description: "Create topic-based communities for deeper engagement"
      },
      {
        title: "Real-time Messaging",
        description: "Individual and group messaging with media sharing"
      },
      {
        title: "Content Moderation AI",
        description: "Intelligent moderation to keep your community safe"
      }
    ],
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2669&q=80",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    buttonText: "Explore Social Network"
  },
  {
    id: "education",
    label: "Educational Portal",
    title: "Educational Portal",
    description: "Create and manage courses, interactive lessons, and assessment tools with our comprehensive educational platform.",
    features: [
      {
        title: "Course Builder",
        description: "Drag-and-drop course creation with multimedia support"
      },
      {
        title: "Assessment Tools",
        description: "AI-powered test generation and grading automation"
      },
      {
        title: "Kid's Mode",
        description: "Age-appropriate content and interfaces with parental controls"
      },
      {
        title: "Progress Tracking",
        description: "Detailed analytics on student performance and engagement"
      }
    ],
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2644&q=80",
    buttonColor: "bg-green-600 hover:bg-green-700",
    buttonText: "Explore Educational Portal"
  },
  {
    id: "crm",
    label: "CRM & Marketing",
    title: "CRM + Marketing",
    description: "Manage your customer relationships and execute powerful marketing campaigns with our integrated CRM and marketing automation tools.",
    features: [
      {
        title: "Contact Management",
        description: "Organize and segment your contacts with custom fields"
      },
      {
        title: "Email Campaigns",
        description: "AI-driven email marketing with performance analytics"
      },
      {
        title: "Lead Scoring",
        description: "Automated lead qualification and nurturing workflows"
      },
      {
        title: "SEO & Ad Management",
        description: "Integrated tools to optimize your digital marketing"
      }
    ],
    image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2650&q=80",
    buttonColor: "bg-amber-600 hover:bg-amber-700",
    buttonText: "Explore CRM & Marketing"
  },
  {
    id: "marketplace",
    label: "Marketplace",
    title: "Marketplace",
    description: "Expand your platform's capabilities with our marketplace of plugins, templates, and AI agents customized for your specific needs.",
    features: [
      {
        title: "Plugin Ecosystem",
        description: "Extend functionality with specialized integrations"
      },
      {
        title: "Template Library",
        description: "Professional designs for every industry and need"
      },
      {
        title: "AI Agent Marketplace",
        description: "Specialized AI assistants for different tasks"
      },
      {
        title: "Developer Tools",
        description: "APIs and SDKs for custom development"
      }
    ],
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=2671&q=80",
    buttonColor: "bg-indigo-600 hover:bg-indigo-700",
    buttonText: "Explore Marketplace"
  }
];

export default function ModulesShowcase() {
  const [activeModule, setActiveModule] = useState("website-builder");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  return (
    <section id="modules" className="py-20 bg-gray-100 dark:bg-gray-800/50 relative">
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
            Powerful <span className="text-gradient">Modules</span> for Every Need
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Each module is designed to work seamlessly together or independently, giving you ultimate flexibility.
          </p>
        </motion.div>
        
        <motion.div
          variants={fadeIn("up", "tween", 0.4, 1)}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <Tabs
            defaultValue="website-builder"
            value={activeModule}
            onValueChange={setActiveModule}
            className="w-full"
          >
            <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-gray-700">
              <TabsList className="bg-transparent h-auto p-0 w-full justify-start">
                {modules.map((module) => (
                  <TabsTrigger
                    key={module.id}
                    value={module.id}
                    className={cn(
                      "px-5 py-4 rounded-none whitespace-nowrap data-[state=active]:text-primary-600 data-[state=active]:dark:text-primary-400 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 data-[state=active]:dark:border-primary-400 data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-gray-300 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:dark:hover:text-white font-medium"
                    )}
                  >
                    {module.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <div className="p-6 lg:p-8">
              {modules.map((module) => (
                <TabsContent key={module.id} value={module.id} className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                      <h3 className="text-2xl font-bold mb-4">{module.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {module.description}
                      </p>
                      <ul className="space-y-3 mb-6">
                        {module.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                            </div>
                            <div>
                              <span className="font-medium">{feature.title}</span>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <Button className={cn("inline-flex items-center justify-center", module.buttonColor)}>
                        {module.buttonText}
                      </Button>
                    </div>
                    
                    <div className="relative">
                      <img 
                        src={module.image} 
                        alt={module.title}
                        className="rounded-xl shadow-xl object-cover w-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-purple-600/10 rounded-xl"></div>
                      
                      {/* Floating elements - only shown for website builder module */}
                      {module.id === "website-builder" && (
                        <>
                          <div className="absolute top-6 right-6 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-xl border border-gray-200 dark:border-gray-700 transform rotate-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                <i className="ri-file-list-3-line text-primary-600 dark:text-primary-400"></i>
                              </div>
                              <div>
                                <div className="text-xs font-semibold">{module.badgeText}</div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">{module.badgeSubtext}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="absolute -bottom-3 -left-3 bg-white dark:bg-gray-800 rounded-lg py-2 px-3 shadow-xl border border-gray-200 dark:border-gray-700 transform -rotate-2">
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-medium">Latest Template:</div>
                              <div className="text-xs px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                                {module.templateType}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </motion.div>
      </motion.div>
    </section>
  );
}
