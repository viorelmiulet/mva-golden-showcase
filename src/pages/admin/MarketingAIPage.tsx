import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SocialMediaContentGenerator } from "@/components/SocialMediaContentGenerator";
import { FurnishedImageGenerator } from "@/components/FurnishedImageGenerator";
import { SocialAutoPostSettings } from "@/components/SocialAutoPostSettings";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const MarketingAIPage = () => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-gold/10 rounded-2xl blur-xl" />
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-gold/5 border border-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketing AI</h1>
          <p className="text-muted-foreground text-sm">Generează conținut și imagini cu inteligență artificială</p>
        </div>
      </motion.div>

      {/* Social Media Content Generator */}
      <motion.div variants={itemVariants}>
        <SocialMediaContentGenerator />
      </motion.div>

      {/* Image Generator */}
      <motion.div variants={itemVariants}>
        <FurnishedImageGenerator />
      </motion.div>

      {/* Auto-Posting Settings */}
      <motion.div variants={itemVariants}>
        <SocialAutoPostSettings />
      </motion.div>
    </motion.div>
  );
};

export default MarketingAIPage;
