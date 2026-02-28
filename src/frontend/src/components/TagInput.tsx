import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  colorClass?: string;
}

export default function TagInput({
  tags,
  onChange,
  placeholder = "Add item...",
  colorClass = "bg-secondary text-secondary-foreground",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {tags.map((tag, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: tags list, order may change
          <Badge key={index} className={`gap-1 text-xs pr-1 ${colorClass}`}>
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="text-sm h-8"
        />
        <button
          type="button"
          onClick={() => addTag(inputValue)}
          className="flex items-center gap-1 px-2.5 h-8 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-xs font-medium transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>
    </div>
  );
}
