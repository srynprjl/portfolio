import { FaHtml5, FaJs, FaPython, FaReact } from "react-icons/fa6";


import ProjectCard from "../components/ProjectCard";
import { FaCss3 } from "react-icons/fa";
import SpotifyClone from "/projects/spotify-clone.png";
import StremioClone from "/projects/stremio-clone.png";
import Portfolio from "/projects/portfolio.png";
import MovieRec from "/projects/movie-rec.png";
import Spam from "/projects/spam.png";
import Sikhai from "/projects/sikhai.png";
export default function Projects() {
  return (
    <>
      <section id="projects" className="my-8 p-16">
        <h1 className="text-center font-bold text-5xl text-white my-8">
          Projects
        </h1>
        <div className="grid grid-cols-3 gap-16 max-xl:grid-cols-2 max-md:grid-cols-1">
          <ProjectCard
            name="Sikhai"
            img={Sikhai}
            website="https://sikhai.sysnefo.com"
            github_url="https://github.com/srynprjl/sikhai"
            languages={[FaHtml5, FaCss3, FaJs, FaReact, FaPython]}
          />
          <ProjectCard
            name="Spotify Frontend Clone"
            img={SpotifyClone}
            website="https://sysnefo.com"
            github_url="https://github.com/srynprjl/spotify-clone"
            languages={[FaHtml5, FaCss3, FaJs]}
          />
          <ProjectCard
            name="Stremio Frontend Clone"
            img={StremioClone}
            website="https://sysnefo.com"
            github_url="https://github.com/srynprjl/stremio-clone"
            languages={[FaHtml5, FaCss3]}
          />
          <ProjectCard
            name="Spam Detection System"
            img={Spam}
            website="https://spam.sysnefo.com"
            github_url="https://github.com/srynprjl/spam-detection-apex"
            languages={[FaPython]}
          />
          <ProjectCard
            name="Movie Recommendation System"
            img={MovieRec}
            website="https://sysnefo.com"
            github_url="https://github.com/srynprjl/movie-recommendation-system"
            languages={[FaPython]}
          />
          <ProjectCard
            name="Portfolio"
            img={Portfolio}
            website="https://shreyanparajuli.com.np"
            github_url="https://github.com/srynprjl/portfolio"
            languages={[FaHtml5, FaCss3, FaJs, FaReact, FaPython]}
          />
        </div>
      </section>
    </>
  );
}
