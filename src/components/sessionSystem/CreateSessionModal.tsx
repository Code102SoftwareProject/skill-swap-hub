import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';

interface Skill {
  id: string;
  skillTitle: string;
  proficiencyLevel: string;
  description: string;
  categoryName: string;
}

interface CreateSessionModalProps {
  onClose: () => void;
  onCreate: (sessionData: any) => Promise<void>;
  mySkills: Skill[];
  theirSkills: Skill[];
  otherUserName: string;
  userId: string;
  otherUserId: string;
}

export default function CreateSessionModal({ 
  onClose, 
  onCreate, 
  mySkills, 
  theirSkills,
  otherUserName,
  userId,
  otherUserId
}: CreateSessionModalProps) {
  const [formData, setFormData] = useState({
    mySkillId: '',
    myDescription: '',
    theirSkillId: '',
    theirDescription: '',
    dueDateMe: getDefaultDueDate(30),
    dueDateThem: getDefaultDueDate(30)
  });
  
  const [selectedMySkill, setSelectedMySkill] = useState<Skill | null>(null);
  const [selectedTheirSkill, setSelectedTheirSkill] = useState<Skill | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group skills by category for better organization
  const groupSkillsByCategory = (skills: Skill[]) => {
    const grouped: {[key: string]: Skill[]} = {};
    
    skills.forEach(skill => {
      if (!grouped[skill.categoryName]) {
        grouped[skill.categoryName] = [];
      }
      grouped[skill.categoryName].push(skill);
    });
    
    return grouped;
  };

  const groupedMySkills = groupSkillsByCategory(mySkills);
  const groupedTheirSkills = groupSkillsByCategory(theirSkills);

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
    
    if (name === 'mySkillId') {
      const skill = mySkills.find(s => s.id === value);
      setSelectedMySkill(skill || null);
    } else if (name === 'theirSkillId') {
      const skill = theirSkills.find(s => s.id === value);
      setSelectedTheirSkill(skill || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.mySkillId || !formData.theirSkillId || 
        !formData.myDescription || !formData.theirDescription) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Map form field names to expected field names
    const sessionData = {
      user1Id: userId,
      skill1Id: formData.mySkillId,
      descriptionOfService1: formData.myDescription,
      user2Id: otherUserId,
      skill2Id: formData.theirSkillId,
      descriptionOfService2: formData.theirDescription,
      startDate: new Date(),
      dueDateUser1: formData.dueDateMe,
      dueDateUser2: formData.dueDateThem
    };
    
    try {
      setIsSubmitting(true);
      setError(null);
      await onCreate(sessionData);
    } catch (err) {
      setError('Failed to create session. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 py-10 px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create Skill Exchange Session</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {(mySkills.length === 0 || theirSkills.length === 0) && (
          <div className="text-center py-3">
            <p className="text-gray-500">Loading skills...</p>
          </div>
        )}

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
                    {Object.entries(groupedMySkills).map(([category, skills]) => (
                      <optgroup key={category} label={category}>
                        {skills.map(skill => (
                          <option key={skill.id} value={skill.id}>
                            {skill.skillTitle} • {skill.proficiencyLevel}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                
                {/* Display selected skill details */}
                {selectedMySkill && (
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <h5 className="font-medium text-sm">{selectedMySkill.skillTitle}</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="inline-block bg-blue-100 px-2 py-0.5 rounded mr-2">
                        {selectedMySkill.proficiencyLevel}
                      </span>
                      {selectedMySkill.categoryName}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Describe what you'll offer</label>
                  <textarea
                    name="myDescription"
                    value={formData.myDescription}
                    onChange={handleChange}
                    className="w-full border rounded p-2 text-sm"
                    rows={3}
                    placeholder="Describe what you'll do, how you'll do, and what the other person will gain."
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
                    {Object.entries(groupedTheirSkills).map(([category, skills]) => (
                      <optgroup key={category} label={category}>
                        {skills.map(skill => (
                          <option key={skill.id} value={skill.id}>
                            {skill.skillTitle} • {skill.proficiencyLevel}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                
                {/* Display selected skill details */}
                {selectedTheirSkill && (
                  <div className="bg-white p-3 rounded border border-green-200">
                    <h5 className="font-medium text-sm">{selectedTheirSkill.skillTitle}</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="inline-block bg-green-100 px-2 py-0.5 rounded mr-2">
                        {selectedTheirSkill.proficiencyLevel}
                      </span>
                      {selectedTheirSkill.categoryName}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Describe what you want to get</label>
                  <textarea
                    name="theirDescription"
                    value={formData.theirDescription}
                    onChange={handleChange}
                    className="w-full border rounded p-2 text-sm"
                    rows={3}
                    placeholder="Describe what you want to get done from the other person..."
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
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-blue-700 flex items-center justify-center min-w-[100px]"
              disabled={isSubmitting || !formData.mySkillId || !formData.theirSkillId}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}