import { db } from "@/lib/database/connection";

export default function TestComponent() {
    return <div>
        <h1>Test Component</h1>
        <p>This is a test component for routing purposes.</p>

        <button onClick={async () => {
            const result = await db.execute("SELECT 1 + 1");
            console.log(result);
        }}>
            Test DB Connection
        </button>
    </div>;
}
