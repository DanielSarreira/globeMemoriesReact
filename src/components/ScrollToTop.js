import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation(); // Obtém o caminho atual

  useEffect(() => {
    window.scrollTo(0, 0); // Força o scroll para o topo da página
  }, [pathname]); // Executa sempre que o caminho muda

  return null;
};

export default ScrollToTop;
