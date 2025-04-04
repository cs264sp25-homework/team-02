import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/dropdown-menu";
import { Button } from "@/core/components/button";
import { Sparkles } from "lucide-react";

interface AiDropdownMenuProps {
  onSelect: (option: string) => void;
}

const AiDropdownMenu = ({ onSelect }: AiDropdownMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Help
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onSelect("refine")}>
          Refine my response
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("generate")}>
          Regenerate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("optimize")}>
          Optimize for job fit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("tone")}>
          Adjust tone
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AiDropdownMenu;
