import { useEffect, useState } from "react";
import "./SplashScreen.css";

export default function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Complete and unmount after fade animation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? "fade-out" : ""}`} data-testid="splash-screen">
      <div className="splash-content">
        <img 
          src="/logo.png" 
          alt="O Melhor de Ilhéus" 
          className="splash-logo"
        />
        <div className="splash-text">
          <h1>O Melhor de Ilhéus</h1>
          <p>Descubra os melhores lugares da cidade</p>
        </div>
        <div className="splash-loader">
          <div className="loader-bar"></div>
        </div>
      </div>
    </div>
  );
}
