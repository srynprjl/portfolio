import { useState, useEffect } from "react";

const useTypewriter = (
  phrases: string[],
  speed: number = 50,
  delay: number = 2000,
): string => {
  const [displayText, setDisplayText] = useState<string>("");
  const [phraseIndex, setPhraseIndex] = useState<number>(0);

  useEffect(() => {
    if (phrases.length === 0) return;
    
    const currentFullText = phrases[phraseIndex];
    if (displayText.length < currentFullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(currentFullText.slice(0, displayText.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      const pauseTimeout = setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
        setDisplayText("");
      }, delay);
      return () => clearTimeout(pauseTimeout);
    }
  }, [displayText, phraseIndex, phrases, speed, delay]);

  return displayText;
};

export default useTypewriter;
