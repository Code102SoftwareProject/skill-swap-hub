interface MessageItemProps {
  name: string;
  date: string;
  isActive: boolean;
  onClick: () => void;
}

export default function MessageItem({ name, date, isActive, onClick }: MessageItemProps) {
    return (
      <div
        className={`flex items-center p-4 cursor-pointer ${
          isActive ? 'bg-gray-200' : 'hover:bg-gray-100'
        }`}
        onClick={onClick}
      >
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">{name}</h4>
          <p className="text-sm text-gray-600">{date}</p>
        </div>
      </div>
    );
  }