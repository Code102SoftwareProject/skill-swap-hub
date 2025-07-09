import React, { useEffect, useState } from 'react';
import { Edit2 } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface UserSkill {
  id: string;
  skillTitle: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Expert';
  categoryName: string;
  description: string;
}

export default function UserSkills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch('/api/myskills', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch skills');
        }

        const data = await response.json();
        if (data.success) {
          setSkills(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch skills');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  // Function to get color based on proficiency level
  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'green';
      case 'Intermediate':
        return 'blue';
      case 'Expert':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Function to get abbreviation from skill title
  const getAbbreviation = (title: string) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">My Skills</h2>
        </div>
        <div className="text-center py-4">Loading skills...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">My Skills</h2>
        </div>
        <div className="text-center py-4 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">My Skills</h2>
        <button className="text-blue-600 hover:text-blue-800" aria-label="Edit Skills">
          <Edit2 className="w-5 h-5" />
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No skills added yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {skills.map((skill) => {
            const color = getProficiencyColor(skill.proficiencyLevel);
            return (
              <div
                key={skill.id}
                className="border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition"
              >
                <div className="flex items-center mb-2">
                  <div
                    className={`w-8 h-8 bg-${color}-100 rounded-md flex items-center justify-center`}
                  >
                    <span className={`text-${color}-600 text-xs font-bold`}>
                      {getAbbreviation(skill.skillTitle)}
                    </span>
                  </div>
                  <div className="ml-2">
                    <h3 className="text-sm font-medium">{skill.skillTitle}</h3>
                    <p className="text-xs text-gray-500">
                      {skill.proficiencyLevel} • {skill.categoryName}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{skill.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}