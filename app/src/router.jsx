import { h, Component, createContext } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';

export const RouterContext = createContext({
  path: window.location.pathname,
  push: (path) => {}
});

export const Router = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const push = (newPath) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  return (
    <RouterContext.Provider value={{ path, push }}>
      {children}
    </RouterContext.Provider>
  );
};

export const Route = ({ path: routePath, component: RouteComponent }) => {
  const { path } = useContext(RouterContext);
  return path === routePath ? <RouteComponent /> : null;
};

export const Link = ({ to, children, className, ...props }) => {
  const { path, push } = useContext(RouterContext);
  
  const handleClick = (e) => {
    e.preventDefault();
    push(to);
  };

  // Compute active state directly and conditionally apply active class if it's there
  let computedClassName = className || '';
  if (path === to && className && className.includes('nav-item')) {
      computedClassName += ' active';
  }

  return (
    <a href={to} onClick={handleClick} class={computedClassName} {...props}>
      {children}
    </a>
  );
};
