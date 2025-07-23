import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <Card className="w-full py-4 flex flex-col items-center gap-2">
      <div className="flex gap-4">
        <Button variant="link" asChild>
          <a href="https://twitter.com/Hayao0819" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
        </Button>
        <Button variant="link" asChild>
          <a href="https://github.com/Hayao0819" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </Button>
        <Button variant="link" asChild>
          <a href="https://www.gity.co.jp/" target="_blank" rel="noopener noreferrer">
            GITY
          </a>
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">© 2025 Hayao0819</span>
    </Card>
  );
}
