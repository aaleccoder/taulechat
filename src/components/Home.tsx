
import { MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { Button } from "./ui/button";

export default function Home() {
    return (
        <div
            className="container flex flex-col items-center justify-center min-h-screen px-4 py-8 gap-6"
            style={{ paddingBottom: 'var(--safe-area-bottom)' }}
        >
            <div className="logo">
                <MessageCircle className="h-24 w-24 mx-auto text-primary" />
            </div>

            <h1 className="text-4xl font-bold text-center">TauLeChat</h1>

            <p className="max-w-md mx-auto text-center text-muted-foreground text-lg leading-relaxed">
                A simple, local-first chat client powered by OpenRouter models. Use the
                sidebar to create or open conversations and get started.
            </p>

            <Button
                asChild
                className="h-12 px-6 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent motion-safe:transition-all motion-safe:duration-150 active:scale-95 hover:shadow-xl hover:scale-105"
                aria-label="Start a new chat"
            >
                <Link to="/chat">Start chat</Link>
            </Button>
        </div >
    );
}


