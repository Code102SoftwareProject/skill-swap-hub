type SkillCardProps = {
    skill: string;
    rating: number;
  };
  
  export default function SkillCard({ skill, rating }: SkillCardProps) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md w-40 text-center">
        <h3 className="font-semibold">{skill}</h3>
        <p className="text-yellow-500">⭐ {rating} / 5</p>
      </div>
    );
  }
  