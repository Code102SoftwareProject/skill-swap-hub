// page.tsx
import Navbar from "../components/Navbar";

export default function Home() {
  return (
      <>
        <div className="p-8">
         <Navbar userName={"Nethmal"} userImage={""} />
        </div>
      </>
  );
}
