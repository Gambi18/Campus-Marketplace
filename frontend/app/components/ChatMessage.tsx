

interface ChatMessageProps {
  text: string;
  timestamp: string;
  isSender: boolean;
}

export default function ChatMessage({ text, timestamp, isSender }: ChatMessageProps) {
  return (
    <div className={`w-full flex flex-col ${isSender ? 'items-end' : 'items-start'} mb-3`}>
      
      <div
        className={`max-w-[75%] sm:max-w-[60%] px-5 py-3 rounded-2xl text-sm font-medium tracking-wide shadow-xs border transition-all duration-150 ${
          isSender
            ? 'bg-blue-700 text-white border-blue-700 rounded-br-none'
            : 'bg-white text-slate-800 border-slate-100 rounded-bl-none'
        }`}
      >
        <p className="leading-relaxed whitespace-pre-line">{text}</p>
      </div>

      <span className="text-[10px] font-bold text-slate-400 mt-1 px-1 tracking-wider uppercase">
        {timestamp}
      </span>
    </div>
  );
}