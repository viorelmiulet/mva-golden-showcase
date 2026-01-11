import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import BusinessCardGenerator from "@/components/BusinessCardGenerator";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const BusinessCardsPage = () => {
  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Modern Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-gold/10 rounded-2xl blur-xl" />
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-gold/5 border border-primary/20">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cărți de Vizită</h1>
          <p className="text-muted-foreground text-sm">Generează și gestionează cărțile de vizită</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <BusinessCardGenerator />
      </motion.div>
    </motion.div>
  );
};

export default BusinessCardsPage;
