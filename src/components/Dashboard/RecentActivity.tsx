'use client';

import { FC, JSX } from 'react';
import { Handshake, Star, BarChart } from 'lucide-react';

type Activity = {
  id: number;
  icon: JSX.Element;
  title: string;
  description: string;
  timeAgo: string;
};

const activities: Activity[] = [
  {
    id: 1,
    icon: <Handshake className="text-blue-600 w-5 h-5" />,
    title: 'Matched with Alice for JavaScript Lessons.',
    description: 'Collaboration for skill improvement started.',
    timeAgo: '1 Day ago',
  },
  {
    id: 2,
    icon: <Star className="text-yellow-500 w-5 h-5" />,
    title: 'Received a 5-star rating.',
    description: "Feedback: 'Excellent work on the stainless steel web project!'",
    timeAgo: '2 hours ago',
  },
  {
    id: 3,
    icon: <BarChart className="text-indigo-600 w-5 h-5" />,
    title: 'Improved Web development skill to 75%.',
    description: "Completed 5 sessions of Ani_tha's tutorials.",
    timeAgo: '2 Weeks ago',
  },
];

const RecentActivity: FC = () => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <span className="text-xl">⋮</span>
        </button>
      </div>

      <ul className="space-y-4">
        {activities.map((activity) => (
          <li key={activity.id} className="flex items-start gap-3">
            <div className="mt-1">{activity.icon}</div>
            <div className="flex-1">
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-gray-500">{activity.description}</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
              {activity.timeAgo}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;
