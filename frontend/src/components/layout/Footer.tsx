import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logo from "/brand/logo.png";

const productLinks = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
];

const loggedOutAccountLinks = [
  { label: "Log in", href: "/login" },
  { label: "Create account", href: "/register" },
];

const loggedInAccountLinks = [{ label: "Dashboard", href: "/dashboard" }];

export const Footer = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const footerLinks = [
    { heading: "Product", links: productLinks },
    {
      heading: "Account",
      links: isAuthenticated ? loggedInAccountLinks : loggedOutAccountLinks,
    },
  ];

  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link to="/" className="inline-flex items-center">
              <img
                src={logo}
                alt="AI Resume Analyzer"
                className="h-12 w-auto object-contain"
              />
            </Link>

            <p className="mt-4 text-sm text-ink-soft">
              Structured feedback on your resume, read the way a recruiter and an
              applicant tracking system both would.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {footerLinks.map((group) => (
              <div key={group.heading}>
                <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                  {group.heading}
                </h3>

                <ul className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-sm text-ink-soft transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}

                  {group.heading === "Account" && isAuthenticated && (
                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-sm text-ink-soft transition-colors hover:text-ink"
                      >
                        Log out
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-soft md:flex-row md:items-center md:justify-between">
          <span>
            © {new Date().getFullYear()} AI Resume Analyzer. All rights reserved.
          </span>

          <span className="font-mono">
            Built for job seekers, not job boards.
          </span>
        </div>
      </div>
    </footer>
  );
};