// import { useState } from "react";
import { FaCss3, FaGolang, FaHtml5, FaJs, FaPython } from "react-icons/fa6";
import Skills from "../components/Skills";
import { FaLinux, FaReact } from "react-icons/fa";
// import { LuCake, LuMail, LuMapPin, LuPen, LuPhone } from "react-icons/lu";
export default function About() {
  return (
    <>
      <section
        id="about"
        className="flex justify-center gap-16 my-16 max-lg:flex-col-reverse"
      >
        <div className="lg:max-w-1/2 text-justify bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl">
          <h1 className="font-black text-white text-4xl text-center">
            About Me!
          </h1>
          <div className="text-white text-[clamp(32px, 5vw, 6vw)] leading-8 flex flex-col gap-7 p-8">
            <p>Hi, I’m Shreyan Parajuli. I build things with code.</p>
            <p>
              As a Computer Science student, I spend my time bridging the gap
              between academic theory and practical application. I’m currently
              proficient in Web Development, JavaScript and Python, with a
              growing interest in Artificial Intelligence.
            </p>
            <p>
              I’m a firm believer that the best way to learn is by doing. That’s
              why you’ll often find me working on some random projects or
              participating in coding challenges. I’m always looking to add new
              tools to my belt and collaborate with other developers.
            </p>
          </div>
          <h1 className="font-black text-white text-4xl text-center">
            My Skills
          </h1>
          <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-4">
            <Skills Icon={FaHtml5} name="HTML" />
            <Skills Icon={FaCss3} name="CSS" />
            <Skills Icon={FaJs} name="JavaScript" />
            <Skills Icon={FaPython} name="Python" />
            <Skills Icon={FaGolang} name="Golang" />
            <Skills Icon={FaReact} name="React" />
            <Skills Icon={FaLinux} name="Linux" />
          </div>
        </div>
        <div className="card bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl flex flex-col justify-center items-center">
          <img src="/srynprjl.jpeg" className=" rounded-2xl w-96"></img>
          {/*<div className="text-white">
            <span className="flex gap-4 items-center">
              <LuPen size={28} />
              Name: Shreyan Parajuli
            </span>
            <span className="flex  gap-4 items-center">
              <LuCake size={28} />
              Birthday: 2005-03-19
            </span>
            <span className="flex  gap-4 items-center">
              <LuMail size={28} />
              Mail: shreyanparajuli@sysnefo.com
            </span>
            <span className="flex gap-4 items-center">
              <LuMapPin size={28} />
            </span>
          </div>*/}
        </div>
      </section>
    </>
  );
}
