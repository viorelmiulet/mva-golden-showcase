import { motion } from "framer-motion";
import { Facebook, Sparkles } from "lucide-react";
import { FacebookContentGenerator } from "@/components/FacebookContentGenerator";
import { FurnishedImageGenerator } from "@/components/FurnishedImageGenerator";

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

const FacebookPage = () => {
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
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-blue-600/10 rounded-2xl blur-xl" />
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20">
            <Facebook className="h-6 w-6 text-blue-400" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social Media & AI</h1>
          <p className="text-muted-foreground text-sm">Generează conținut și imagini cu AI</p>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants}>
        <FurnishedImageGenerator />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <FacebookContentGenerator />
      </motion.div>
    </motion.div>
  );
};

export default FacebookPage;
