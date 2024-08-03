import './Layout.css';

interface PropsLayout {
  children: React.ReactNode;
}

const Layout: React.FC<PropsLayout> = ({ children }) => {
  return <div className="layout">{children}</div>;
};

export default Layout;
