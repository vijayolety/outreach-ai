// web/src/app/docs/page.tsx
import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./ReactSwagger";

export const metadata = {
    title: "API Documentation | Example",
};

export default async function DocsPage() {
    const spec = await getApiDocs();

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto py-8">
                <ReactSwagger spec={spec} />
            </div>
        </div>
    );
}