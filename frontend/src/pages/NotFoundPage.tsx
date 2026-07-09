import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-6 text-center text-ink">
      <span className="font-mono text-xs uppercase tracking-widest text-signal">404</span>
      <h1 className="font-display text-3xl font-medium">Page not found</h1>
      <Link to="/" className="text-sm font-medium text-signal">
        Back to home
      </Link>
    </div>
  );
};

export default NotFoundPage;
