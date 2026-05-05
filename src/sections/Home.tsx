import useTypewriter from "../hooks/useTypewriter";
import { GrProjects } from "react-icons/gr";
import SocialMedia from "../components/SocialMedia";
import { FaEnvelope, FaGithub, FaLinkedin, FaUser } from "react-icons/fa";
import { FaDiscord, FaDownload, FaInstagram } from "react-icons/fa6";
import Button from "../components/Button";

const Typewriter = ({
  texts,
  speed,
  className = "",
}: {
  texts: Array<string>;
  speed: number;
  className?: string;
}) => {
  const displayText = useTypewriter(texts, speed);
  return <span className={className}>{displayText}</span>;
};

export default function Home() {
  return (
    <>
      <section
        id="home"
        className="py-1 flex flex-col items-center justify-center gap-8 min-h-screen"
      >
        <div className="flex items-center flex-col justify-center text-white gap-4">
          <h2 className="text-center font-normal text-[clamp(24px,2.3vw,64px)]">
            Hello, I am
          </h2>
          <h1 className="font-black text-[clamp(64px,6vw,200px)] text-center drop-shadow-[0_10px_100px] drop-shadow-white">
            Shreyan Parajuli
          </h1>
          <h2 className="text-center font-normal text-[clamp(24px,2.3vw,64px)]">
            I am a &nbsp;
            <Typewriter
              className="underline text-amber-200"
              speed={50}
              texts={["Programmer", "Web Developer", "Student"]}
            />
          </h2>
        </div>
        <div className="flex gap-4 max-md:flex-col">
          <Button link="#about" name="About" Icon={FaUser} />
          <Button link="#" name="Download CV" Icon={FaDownload} />
          <Button link="#projects" name="Projects" Icon={GrProjects} />
        </div>
        <div className="flex gap-4 items-center justify-center text-white ">
          <SocialMedia link="https://github.com/srynprjl" Icon={FaGithub} />
          <SocialMedia
            link="https://instagram.com/srynprjl"
            Icon={FaInstagram}
          />
          <SocialMedia
            link="https://discord.com/users/1327997038255804457"
            Icon={FaDiscord}
          />
          <SocialMedia
            link="https://linkedin.com/in/srynprjl"
            Icon={FaLinkedin}
          />

          <SocialMedia
            Icon={FaEnvelope}
            link="mailto:mail@shreyanparajuli.com.np"
          />
        </div>
      </section>
    </>
  );
}
