import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

type AiFeature = {
  icon: string;
  title: string;
  description: string;
  prompt: string;
  iconBgClass: string;
  iconTextClass: string;
};

const aiFeatures: AiFeature[] = [
  {
    icon: "ri-building-line",
    title: "EchoBuilder",
    description: "Automatically generates websites and stores based on your requirements and brand identity.",
    prompt: "Build me a yoga studio website",
    iconBgClass: "bg-primary-100 dark:bg-primary-900/30",
    iconTextClass: "text-primary-600 dark:text-primary-400"
  },
  {
    icon: "ri-quill-pen-line",
    title: "EchoWriter",
    description: "Creates SEO-optimized content for blogs, product descriptions, and marketing materials.",
    prompt: "Write about sustainable fashion",
    iconBgClass: "bg-purple-100 dark:bg-purple-900/30",
    iconTextClass: "text-purple-600 dark:text-purple-400"
  },
  {
    icon: "ri-mail-send-line",
    title: "EchoMarketer",
    description: "Designs and executes marketing funnels, CRM automation, and email campaigns.",
    prompt: "Create a product launch campaign",
    iconBgClass: "bg-secondary-100 dark:bg-secondary-900/30",
    iconTextClass: "text-secondary-600 dark:text-secondary-400"
  }
];

const aiAgents = [
  {
    icon: "ri-code-box-line",
    title: "EchoDevBot",
    description: "Writes and debugs custom plugin code",
    iconBgClass: "bg-red-100 dark:bg-red-900/30",
    iconTextClass: "text-red-600 dark:text-red-400"
  },
  {
    icon: "ri-book-mark-line",
    title: "EchoTeacher",
    description: "Creates lessons and generates tests",
    iconBgClass: "bg-amber-100 dark:bg-amber-900/30",
    iconTextClass: "text-amber-600 dark:text-amber-400"
  },
  {
    icon: "ri-shield-check-line",
    title: "GuardianAI",
    description: "Manages parental control logic",
    iconBgClass: "bg-blue-100 dark:bg-blue-900/30",
    iconTextClass: "text-blue-600 dark:text-blue-400"
  },
  {
    icon: "ri-line-chart-line",
    title: "EnterpriseOps",
    description: "Analyzes data and triggers workflows",
    iconBgClass: "bg-green-100 dark:bg-green-900/30",
    iconTextClass: "text-green-600 dark:text-green-400"
  }
];

// Demo chat messages
const initialChatMessages = [
  { 
    isUser: true, 
    text: "Build me a yoga studio website with online booking.",
    avatar: "ri-user-line"
  },
  { 
    isUser: false, 
    text: "I'll create a yoga studio website with online booking functionality. What should I include?",
    avatar: "ri-robot-line",
    options: [
      "Home page with classes showcase",
      "Instructor profiles and bios",
      "Class schedule with online booking",
      "Membership options and pricing"
    ]
  },
  { 
    isUser: true, 
    text: "Yes, and add a blog section for wellness content.",
    avatar: "ri-user-line"
  },
  { 
    isUser: false, 
    text: "Perfect! I'll add a blog section for wellness content. Here's what I'm creating for you:",
    avatar: "ri-robot-line",
    progress: 65,
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-4.0.3&auto=format&fit=crop&w=2670&q=80",
    projectName: "Serenity Yoga Studio",
    estimatedCompletion: "2 minutes"
  }
];

export default function AIOmnilayerSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [inputValue, setInputValue] = useState("");
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setChatMessages([
        ...chatMessages,
        { isUser: true, text: inputValue, avatar: "ri-user-line" }
      ]);
      setInputValue("");
      
      // Simulate AI response after a short delay
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          { 
            isUser: false, 
            text: "I understand you'd like to add this feature. Let me update the plan and continue building your website.",
            avatar: "ri-robot-line"
          }
        ]);
      }, 1000);
    }
  };
  
  return (
    <section id="ai-omnilayer" className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute right-[30%] top-[20%] w-[30%] h-[30%] rounded-full bg-primary-400/10 dark:bg-primary-900/10 blur-[100px]"></div>
        <div className="absolute left-[20%] bottom-[10%] w-[40%] h-[40%] rounded-full bg-purple-400/10 dark:bg-purple-900/10 blur-[100px]"></div>
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
          className="text-center mb-16"
        >
          <div className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-4 py-1.5 mb-4">
            <span className="text-sm font-medium text-primary-800 dark:text-primary-300">POWERED BY AI</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
            AI <span className="text-gradient">Omnilayer</span> System
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our advanced AI system that powers every aspect of your platform, automating complex tasks and delivering personalized experiences.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            variants={fadeIn("right", "tween", 0.4, 1)}
            className="order-2 lg:order-1"
          >
            <div className="space-y-6">
              {aiFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={fadeIn("right", "tween", 0.4 + index * 0.1, 1)}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="ai-feature bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", feature.iconBgClass)}>
                      <i className={cn(feature.icon, "text-xl", feature.iconTextClass)}></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                        {feature.description}
                      </p>
                      <div className={cn("flex gap-2 items-center text-sm", feature.iconTextClass)}>
                        <span className="font-medium">Try prompt:</span>
                        <span className={cn("bg-primary-50 dark:bg-primary-900/50 px-2 py-1 rounded", feature.iconBgClass.replace('bg-', 'bg-').replace('dark:bg-', 'dark:bg-'))}>
                          "{feature.prompt}"
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* AI Demo Interface */}
          <motion.div 
            variants={fadeIn("left", "tween", 0.4, 1)}
            className="order-1 lg:order-2"
          >
            <div className="relative">
              {/* Demo "Interface" */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Interface header */}
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm font-medium">AI Omnilayer Console</div>
                  <div className="w-4"></div> {/* Spacer to balance the header */}
                </div>
                
                {/* Interface body */}
                <div className="p-6">
                  <div className="flex flex-col h-[400px]">
                    {/* Chat history */}
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                      {chatMessages.map((message, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            message.isUser 
                              ? "bg-gray-200 dark:bg-gray-600" 
                              : "bg-primary-100 dark:bg-primary-900/50"
                          )}>
                            <i className={cn(
                              message.avatar,
                              message.isUser 
                                ? "text-gray-600 dark:text-gray-200" 
                                : "text-primary-600 dark:text-primary-400"
                            )}></i>
                          </div>
                          <div className={cn(
                            "rounded-xl py-2 px-3 max-w-[80%]",
                            message.isUser 
                              ? "bg-gray-100 dark:bg-gray-700" 
                              : "bg-primary-50 dark:bg-primary-900/20"
                          )}>
                            <p className="text-sm mb-2">{message.text}</p>
                            
                            {message.options && (
                              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                                {message.options.map((option, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <i className="ri-checkbox-blank-circle-fill text-[6px] mt-1.5"></i>
                                    <span>{option}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            
                            {message.image && (
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-2">
                                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded mb-2 overflow-hidden">
                                  <img src={message.image} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-medium">{message.projectName}</div>
                                  <div className="text-xs text-primary-600 dark:text-primary-400">
                                    Building... {message.progress}%
                                  </div>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className="h-full bg-primary-500 rounded-full"
                                    style={{ width: `${message.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            {message.estimatedCompletion && (
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                Estimated completion: {message.estimatedCompletion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Input area */}
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          value={inputValue}
                          onChange={handleInputChange}
                          placeholder="Type your request..."
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <i className="ri-mic-line text-lg"></i>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        className="p-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                      >
                        <i className="ri-send-plane-fill text-lg"></i>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 -z-10 w-full h-full rounded-xl bg-gradient-to-r from-primary-500/20 to-purple-500/20 blur-sm"></div>
              <div className="absolute -top-4 -left-4 -z-10 w-full h-full rounded-xl bg-gradient-to-r from-purple-500/20 to-primary-500/20 blur-sm"></div>
            </div>
          </motion.div>
        </div>
        
        {/* More AI agents */}
        <motion.div 
          variants={fadeIn("up", "tween", 0.6, 1)}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {aiAgents.map((agent, index) => (
            <motion.div
              key={agent.title}
              variants={fadeIn("up", "tween", 0.6 + index * 0.1, 1)}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4", agent.iconBgClass)}>
                <i className={cn(agent.icon, "text-xl", agent.iconTextClass)}></i>
              </div>
              <h3 className="text-base font-bold mb-1">{agent.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {agent.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
