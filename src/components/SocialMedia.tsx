import { type IconType } from "react-icons";
export default function SocialMedia({
  link,
  Icon,
}: {
  link: string;
  Icon: IconType;
}) {
  return (
    <a href={link} className="hover:scale-125">
      <Icon size={32} />
    </a>
  );
}
