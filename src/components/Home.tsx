
import { MessageCircle } from "lucide-react";
import { Link } from "react-router";

export default function Home() {
    return (
        <div className="container flex flex-col items-center">
            <div className="logo">
                <MessageCircle className="h-24 w-24 mx-auto" />
            </div>

            <h1 className="text-3xl font-semibold mb-2">TauLeChat</h1>

            <p className="max-w-xl mx-auto text-center text-muted-foreground">
                A simple, local-first chat client powered by OpenRouter models. Use the
                sidebar to create or open conversations and get started.
            </p>

            <div className="mt-6">
                <Link to="/chat" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded">
                    Start chat
                </Link>
            </div>
        </div>
    );
}


