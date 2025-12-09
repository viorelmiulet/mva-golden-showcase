import { FacebookContentGenerator } from "@/components/FacebookContentGenerator";
import { FurnishedImageGenerator } from "@/components/FurnishedImageGenerator";

const FacebookPage = () => {
  return (
    <div className="space-y-6">
      <FurnishedImageGenerator />
      <FacebookContentGenerator />
    </div>
  );
};

export default FacebookPage;
