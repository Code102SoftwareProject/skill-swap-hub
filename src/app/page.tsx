import { CardWithBar } from "@/components/Dashboard/SkillsRequested";
import { CardWithChart } from "@/components/Dashboard/TimeSpentChart";

const Home = () => {
  return (
   

    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-6">Dashboard</h1>
      <CardWithChart />
      <div>
      <CardWithBar/>
      </div>
    </div>
    
    
  )
}

export default Home;
