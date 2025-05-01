import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

// Pricing data
const pricingPlans = [
  {
    title: "Starter",
    description: "Perfect for individuals and small projects just getting started.",
    monthlyPrice: "$29",
    yearlyPrice: "$278",
    features: [
      { text: "1 Website", included: true },
      { text: "Website Builder + CMS", included: true },
      { text: "Basic E-Commerce (50 products)", included: true },
      { text: "AI Content Generation (5k words/mo)", included: true },
      { text: "Community Support", included: true },
      { text: "Social Network Features", included: false },
      { text: "Educational Portal", included: false }
    ],
    highlighted: false,
    buttonText: "Get Started",
    buttonClass: "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
  },
  {
    title: "Professional",
    description: "Ideal for growing businesses with more advanced needs.",
    badge: "MOST POPULAR",
    monthlyPrice: "$79",
    yearlyPrice: "$758",
    features: [
      { text: "5 Websites", included: true },
      { text: "Advanced Website Builder + CMS", included: true },
      { text: "Full E-Commerce (500 products)", included: true },
      { text: "Social Network Features", included: true },
      { text: "AI Content Generation (50k words/mo)", included: true },
      { text: "CRM + Basic Marketing", included: true },
      { text: "Email & Chat Support", included: true }
    ],
    highlighted: true,
    buttonText: "Get Started",
    buttonClass: "bg-primary-600 hover:bg-primary-700 text-white"
  },
  {
    title: "Enterprise",
    description: "For large organizations requiring maximum capabilities and support.",
    monthlyPrice: "$199",
    yearlyPrice: "$1,910",
    features: [
      { text: "Unlimited Websites", included: true },
      { text: "All Modules Included", included: true },
      { text: "Unlimited E-Commerce", included: true },
      { text: "White Labeling", included: true },
      { text: "Advanced AI Capabilities", included: true },
      { text: "Developer APIs & SDKs", included: true },
      { text: "24/7 Priority Support", included: true }
    ],
    highlighted: false,
    buttonText: "Contact Sales",
    buttonClass: "bg-gradient-to-r from-primary-600 to-purple-600 hover:opacity-90 text-white"
  }
];

// Testimonial data
const testimonials = [
  {
    text: "Echoverse has completely transformed our digital presence. The AI-generated content saves us hours every week and the results are amazing.",
    author: "Sarah Johnson",
    role: "Marketing Director, Bloom Co.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
  },
  {
    text: "The e-commerce module handled our holiday sales surge without a hitch. The AI-powered recommendations increased our average order value by 32%.",
    author: "Michael Torres",
    role: "CEO, Urban Threads",
    avatar: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
  },
  {
    text: "As an educational institution, we needed something that could grow with us. Echoverse's modular approach means we only pay for what we need.",
    author: "Jennifer Park",
    role: "Director, Future Learning Academy",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
  }
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  const toggleBilling = () => {
    setIsYearly(!isYearly);
  };
  
  return (
    <section id="pricing" className="py-20 bg-gray-100 dark:bg-gray-800/50 relative">
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
            Simple, Transparent <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose the perfect plan for your needs. All plans include core features with no hidden fees.
          </p>
        </motion.div>
        
        {/* Pricing Toggle */}
        <motion.div 
          variants={fadeIn("up", "tween", 0.3, 1)}
          className="flex justify-center items-center space-x-3 mb-10"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly</span>
          <Switch
            checked={isYearly}
            onCheckedChange={toggleBilling}
            className="data-[state=checked]:bg-primary-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Yearly <span className="text-xs text-primary-600 dark:text-primary-400">Save 20%</span>
          </span>
        </motion.div>
        
        {/* Pricing Cards */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.title}
              variants={fadeIn("up", "tween", 0.4 + index * 0.1, 1)}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className={cn(
                "bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all hover:shadow-2xl",
                plan.highlighted 
                  ? "border-2 border-primary-500 dark:border-primary-400 relative" 
                  : "border border-gray-200 dark:border-gray-700"
              )}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-primary-500 text-xs text-white px-3 py-1 font-medium">
                  {plan.badge}
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">{plan.title}</h3>
                <div className="flex items-end mb-5">
                  <span className="text-4xl font-bold pricing-amount">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1 pb-1">/mo</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-5">
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <>
                          <i className="ri-check-line text-green-500 mt-0.5"></i>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{feature.text}</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-close-line text-gray-400 mt-0.5"></i>
                          <span className="text-sm text-gray-400">{feature.text}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <Button className={cn("w-full", plan.buttonClass)}>
                  {plan.buttonText}
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Testimonials */}
        <motion.div 
          variants={staggerContainer}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={fadeIn("up", "tween", 0.7 + index * 0.1, 1)}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex gap-1 mb-4 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="ri-star-fill"></i>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <img src={testimonial.avatar} alt={testimonial.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-medium">{testimonial.author}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
