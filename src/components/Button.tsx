import type { IconType } from "react-icons";

export default function Button({
  link,
  name,
  Icon,
}: {
  link: string;
  name: string;
  Icon: IconType;
}) {
  return (
    <a href={link}>
      <button className="rounded-full bg-white px-2.5 py-2 font-bold w-48 border-0 flex items-center justify-between drop-shadow-lg drop-shadow-emerald-200 hover:scale-110">
        <span>{name}</span>
        <div className="bg-[#c0d1ff] w-8 h-8 flex flex-col justify-center items-center rounded-full">
          <Icon size={16} />
        </div>
      </button>
    </a>
  );
}
