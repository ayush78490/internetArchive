import {
  AlertTriangle,
  Book,
  BrainCircuit,
  Clapperboard,
  Code2,
  Compass,
  Cpu,
  Database,
  Download,
  FileText,
  Film,
  FolderOpen,
  Gamepad2,
  Globe,
  GraduationCap,
  Grid2x2,
  Image as ImageIcon,
  Joystick,
  Languages,
  Magnet,
  MessageCircle,
  Music,
  Shield,
  Smartphone,
  Terminal,
  Type,
  type LucideIcon,
} from "lucide-react";

/** Maps the icon key emitted by the build script to a component. */
const ICONS: Record<string, LucideIcon> = {
  clapperboard: Clapperboard,
  music: Music,
  gamepad: Gamepad2,
  book: Book,
  graduation: GraduationCap,
  sparkles: BrainCircuit,
  download: Download,
  magnet: Magnet,
  phone: Smartphone,
  terminal: Terminal,
  cpu: Cpu,
  folder: FolderOpen,
  globe: Globe,
  chat: MessageCircle,
  type: Type,
  film: Film,
  image: ImageIcon,
  code: Code2,
  joystick: Joystick,
  shield: Shield,
  database: Database,
  languages: Languages,
  grid: Grid2x2,
  compass: Compass,
  warning: AlertTriangle,
  text: FileText,
};

export function CategoryIcon({
  name,
  className = "size-4",
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Grid2x2;
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
