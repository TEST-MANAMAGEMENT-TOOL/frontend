import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export const WhatsAppButton = () => {
  const handleClick = () => {
    window.open("https://wa.me/254111800542", "_blank");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={handleClick} 
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        size="lg"
      >
        <MessageCircle className="w-5 h-5" />
        WhatsApp Support
      </Button>
    </div>
  );
};
