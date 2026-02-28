import { Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const utm = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <div>
              <span className="font-display font-bold text-navy text-sm">
                PulseCard
              </span>
              <p className="text-xs text-muted-foreground">
                Your Medical Identity, Always Accessible
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Emergency-Ready</span>
              <span>·</span>
              <span>AI-Powered</span>
              <span>·</span>
              <span>QR Access</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            © {year}. Built with{" "}
            <Heart className="inline w-3 h-3 text-destructive fill-destructive" />{" "}
            using{" "}
            <a
              href={utm}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
