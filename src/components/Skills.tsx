import { type IconType } from "react-icons";
export default function Skills({
  name,
  Icon,
}: {
  name: string;
  Icon: IconType;
}) {
  return (
    <div className="flex bg-[#1c1917] w-auto text-white items-center gap-3 p-4 rounded-md">
      <div>
        <Icon size={32} />
      </div>
      <div>{name}</div>
    </div>
  );
}
