

export default function LoadingUI() {
    return (
        <div className="flex items-center space-x-1 py-2">
            <span
                className="dot bg-muted rounded-full w-2 h-2 animate-bounce"
                style={{ animationDelay: "0ms" }}
            />
            <span
                className="dot bg-muted rounded-full w-2 h-2 animate-bounce"
                style={{ animationDelay: "150ms" }}
            />
            <span
                className="dot bg-muted rounded-full w-2 h-2 animate-bounce"
                style={{ animationDelay: "300ms" }}
            />
        </div>
    )
}