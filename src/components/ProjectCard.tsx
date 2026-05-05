import type { IconType } from "react-icons";
import { FaGithub, FaLink } from "react-icons/fa6";

interface IconListProps {
  img?: string;
  name: string;
  description?: string;
  github_url?: string;
  website: string;
  status?: string;
  languages: IconType[];
}

export default function ProjectCard({
  img,
  name,
  description,
  languages,
  github_url,
  website,
}: IconListProps) {
  return (
    <>
      <div className="card  bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col gap-4">
        <img
          src={img ? img : "/placeholder.png"}
          className="aspect-video w-auto rounded-2xl"
        />
        <h1 className="text-white text-2xl font-bold text-center">{name}</h1>
        {description ? (
          <h2 className="text-white text-lg font-semibold">
            Description: {description}
          </h2>
        ) : null}
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          Language Used:{" "}
          {languages.map((Icon, index) => (
            <Icon key={index} size={20} />
          ))}
        </h2>
        <div className="flex gap-2 text-white">
          {github_url ? (
            <a href={github_url} className="hover:scale-125">
              <FaGithub size={28} />
            </a>
          ) : null}
          {website ? (
            <a href={website} className="hover:scale-125">
              <FaLink size={28} />
            </a>
          ) : null}
        </div>
      </div>
    </>
  );
}
