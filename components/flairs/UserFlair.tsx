import { Badge } from "@/components/ui/badge";

export interface UserFlairProps {
  flair: string;
  size?: 'sm' | 'md' | 'lg';
}

export type FlairType = 
  | "Echo Warrior" 
  | "Shukar" 
  | "Dubios" 
  | "Fan Nane"
  | "Comment";

/**
 * Determines the flair type from the flair text
 */
export function getFlairType(flair: string): FlairType {
  if (flair.includes("Echo Warrior")) return "Echo Warrior";
  if (flair.includes("Shukar")) return "Shukar";
  if (flair.includes("Dubios")) return "Dubios";
  if (flair.includes("Fan Nane")) return "Fan Nane";
  return "Comment";
}

/**
 * Gets the appropriate color scheme for a flair type
 */
export function getFlairColors(type: FlairType): string {
  switch (type) {
    case "Echo Warrior":
      return "bg-gradient-to-r from-violet-500/80 to-blue-500/80 hover:from-violet-600 hover:to-blue-600 text-white border border-violet-400/20";
    case "Shukar":
      return "bg-gradient-to-r from-yellow-500/80 to-amber-500/80 hover:from-yellow-600 hover:to-amber-600 text-white border border-yellow-400/20";
    case "Dubios":
      return "bg-gradient-to-r from-red-500/80 to-pink-500/80 hover:from-red-600 hover:to-pink-600 text-white border border-red-400/20";
    case "Fan Nane":
      return "bg-gradient-to-r from-purple-500/80 to-indigo-500/80 hover:from-purple-600 hover:to-indigo-600 text-white border border-purple-400/20";
    case "Comment":
      return "bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-600 hover:to-emerald-600 text-white border border-green-400/20";
  }
}

/**
 * A reusable component for displaying user flairs with appropriate styling
 */
export function UserFlair({ flair, size = 'md' }: UserFlairProps) {
  const flairType = getFlairType(flair);
  const colorClass = getFlairColors(flairType);
  
  // Size classes
  const sizeClasses = {
    sm: "text-xs py-0.5 px-2",
    md: "text-sm py-1 px-3",
    lg: "text-base py-1.5 px-4"
  };
  
  return (
    <Badge 
      variant="secondary" 
      className={`font-medium transition-all ${colorClass} ${sizeClasses[size]}`}
    >
      {flair}
    </Badge>
  );
}

/**
 * Renders a list of flairs
 */
export function UserFlairs({ 
  flairs, 
  size = 'md',
  className = ''
}: { 
  flairs: string[]; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  if (!flairs || flairs.length === 0) return null;
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {flairs.map((flair, i) => (
        <UserFlair key={i} flair={flair} size={size} />
      ))}
    </div>
  );
} 