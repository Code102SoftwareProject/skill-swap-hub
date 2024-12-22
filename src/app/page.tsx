// page.tsx
import Image from "next/image";

export default function Home() {
  return (
      <>
        <div className="p-8">
          <h1 className="font-heading text-4xl text-primary">This is a Heading</h1>
          <p className="font-body text-lg text-secondary">
            This is body text styled with content.
          </p>
        </div>
      </>
  );
}
