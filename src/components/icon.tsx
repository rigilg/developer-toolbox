import {
  Braces,
  Binary,
  ShieldCheck,
  Network,
  Clock3,
  Sparkles,
  Code2,
  type LucideProps,
} from "lucide-react";
const icons = { Braces, Binary, ShieldCheck, Network, Clock3, Sparkles, Code2 };
export function Icon({ name, ...props }: LucideProps & { name: string }) {
  const Comp = icons[name as keyof typeof icons] || Code2;
  return <Comp {...props} aria-hidden="true" />;
}
