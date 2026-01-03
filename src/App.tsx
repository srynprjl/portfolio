import { SiLinkedin, SiInstagram, SiGithub, SiX } from "react-icons/si";
import useTypewriter from "./hooks/useTypewriter";

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
  return <p className={className}>{displayText}</p>;
};

function App() {
  return (
    <>
      <div className="p-6 flex flex-col justify-between h-screen">
        <nav className="flex justify-center list-none font-sans text-2xl font-semibold text-white gap-64">
          <li className="hover:scale-110">About</li>
          <li className="hover:scale-110">Projects</li>
          <li className="hover:scale-110">Contact</li>
        </nav>
        <div className="flex flex-col gap-6">
          <h1 className="text-9xl uppercase text-white font-display font-extrabold flex justify-center items-center">
            Shreyan Parajuli
          </h1>
          <h2 className="font-display text-4xl font-bold text-white  justify-center items-center flex">
            I am a&nbsp;
            <Typewriter
              className="text-blue-300"
              speed={50}
              texts={["Programmer", "Web Developer", "Student"]}
            />
          </h2>
          <div className="flex gap-8 justify-center">
            {/*<SiFacebook size={40} color="#fff" />*/}
            <a href="https://linkedin.com/in/srynprjl">
              <SiLinkedin size={40} color="#fff" className="hover:scale-125" />
            </a>
            <a href="x.com/srynprjl">
              <SiX size={40} color="#fff" className="hover:scale-125" />
            </a>
            <a href="instagram.com/srynprjl">
              <SiInstagram size={40} color="#fff" className="hover:scale-125" />
            </a>
            <a href="github.com/srynprjl">
              <SiGithub size={40} color="#fff" className="hover:scale-125" />
            </a>
          </div>
        </div>

        <div></div>
      </div>
    </>
  );
}

export default App;
