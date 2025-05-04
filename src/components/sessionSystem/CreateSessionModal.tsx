import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Skill {
  id: string;
  skillTitle: string;
  proficiencyLevel: string;
  description: string;
  categoryName: string;
}

interface CreateSessionModalProps {
  onClose: () => void;
  onCreate: (sessionData: any) => void;
  mySkills: Skill[];
  theirSkills: Skill[];
  otherUserName: string;
}

export default function CreateSessionModal({ 
  onClose, 
  onCreate, 
  mySkills, 
  theirSkills,
  otherUserName
}: CreateSessionModalProps) {
  const [formData, setFormData] = useState({
    mySkillId: '',
    myDescription: '',
    theirSkillId: '',
    theirDescription: '',
    dueDateMe: getDefaultDueDate(30),  // 30 days from now
    dueDateThem: getDefaultDueDate(30) // 30 days from now
  });
  
  const [selectedMySkill, setSelectedMySkill] = useState<Skill | null>(null);
  const [selectedTheirSkill, setSelectedTheirSkill] = useState<Skill | null>(null);

  // Set default skills when component loads
  useEffect(() => {
    if (mySkills.length > 0 && !formData.mySkillId) {
      setFormData(prev => ({
        ...prev,
        mySkillId: mySkills[0].id
      }));
      setSelectedMySkill(mySkills[0]);
    }
    
    if (theirSkills.length > 0 && !formData.theirSkillId) {
      setFormData(prev => ({
        ...prev,
        theirSkillId: theirSkills[0].id
      }));
      setSelectedTheirSkill(theirSkills[0]);
    }
  }, [mySkills, theirSkills, formData.mySkillId, formData.theirSkillId]);

  function getDefaultDueDate(daysFromNow: number) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update selected skill objects when dropdowns change
    if (name === 'mySkillId') {
      const skill = mySkills.find(s => s.id === value);
      setSelectedMySkill(skill || null);
      if (skill) {
        setFormData(prev => ({
          ...prev,
          myDescription: skill.description || ''
        }));
      }
    } else if (name === 'theirSkillId') {
      const skill = theirSkills.find(s => s.id === value);
      setSelectedTheirSkill(skill || null);
      if (skill) {
        setFormData(prev => ({
          ...prev,
          theirDescription: `I would like to learn ${skill.skillTitle} from you.`
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create Skill Exchange Session</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* My skill selection */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Your skill to offer</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Select your skill</label>
                  <select
                    name="mySkillId"
                    value={formData.mySkillId}
                    onChange={handleChange}
                    className="w-full border rounded p-2 text-sm"
                    required
                  >
                    <option value="">-- Select a skill --</option>
                    {mySkills.map(skill => (
                      <option key={skill.id} value={skill.id}>
                        {skill.skillTitle} ({skill.proficiencyLevel}) - {skill.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Describe what you'll teach</label>
                  <textarea
                    name="myDescription"
                    value={formData.myDescription}
                    onChange={handleChange}
                    className="w-full border rounded p-2 text-sm"
                    rows={3}
                    placeholder="Describe what you'll teach, how you'll teach it, and what the other person will learn..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Your due date</label>
                  <input
                    type="date"
                    name="dueDateMe"
                    value={formData.dueDateMe}
                    onChange={handleChange}
                    className="w-full border rounded p-2 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Their skill selection */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Skill you want from {otherUserName}</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Select their skill</label>
                  <select
                    name="theirSkillId"
                    value={formData.theirSkillId}
                    onChange={handleChange}
                    className="w-full border rounded p-2 text-sm"
                    required
                  >
                    <option value="">-- Select a skill --</option>
                    {theirSkills.map(skill => (
                      <option key={skill.id} value={skill.id}>
                        {skill.skillTitle} ({skill.proficiencyLevel}) - {skill.categoryName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Describe what you want to learn</label>
                  <textarea
                    name="theirDescription"
                    value={formData.theirDescription}
                    onChange={handleChange}
                    className="w-full border rounded p-2 text-sm"
                    rows={3}
                    placeholder="Describe what you want to learn from the other person..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Their due date</label>
                  <input
                    type="date"
                    name="dueDateThem"
                    value={formData.dueDateThem}
                    onChange={handleChange}
                    className="w-full border rounded p-2 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-blue-700"
              disabled={!formData.mySkillId || !formData.theirSkillId}
            >
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}