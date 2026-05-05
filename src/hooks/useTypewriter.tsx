import { useEffect, useState } from "react";

export default function useTypewriter(
  texts: string[],
  speed: number = 50,
  delay: number = 5000,
) {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [displayText, setDisplayText] = useState<string>("");
  const [index, setIndex] = useState<number>(0);
  useEffect(() => {
    if (texts.length == 0) return;
    const currentText = texts[index];

    if (!isDeleting && displayText.length < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(currentText.slice(0, displayText.length + 1));
      }, speed);

      return () => clearTimeout(timeout);
    } else if (displayText.length == currentText.length && !isDeleting) {
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, delay);

      return () => clearTimeout(timeout);
    } else if (isDeleting && displayText.length > 0) {
      const timeout = setTimeout(() => {
        setDisplayText(currentText.slice(0, displayText.length - 1));
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      setIndex((prev) => (prev + 1) % texts.length);
      setIsDeleting(false);
    }
  });

  return displayText;
}
