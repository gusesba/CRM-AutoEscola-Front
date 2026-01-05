type Props = {
  text: string;
  isMe?: boolean;
};

export function MessageBubble({ text, isMe }: Props) {
  return (
    <div
      className={`max-w-[70%] px-3 py-2 rounded-lg text-sm
        ${isMe ? "bg-[#005c4b] ml-auto" : "bg-[#202c33]"}
      `}
    >
      <p className="text-white whitespace-pre-wrap">{text}</p>
    </div>
  );
}
