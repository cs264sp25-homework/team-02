import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useState } from "react";
import { cn } from "@/core/lib/utils";
import { User, Menu, X } from "lucide-react";
import { Button } from "@/core/components/button";

export const NavBar = () => {
  const { navigate } = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("login");
    setIsProfileMenuOpen(false);
  };

  const navItems = [
    { label: "Home", route: "home" },
    { label: "Job Import", route: "import_job", requiresAuth: true },
    { label: "Resume Upload", route: "add_file", requiresAuth: true },
    { label: "Chat", route: "chat", requiresAuth: true },
    { label: "Demo", route: "demo" },
  ];

  // Filter nav items based on authentication status
  const filteredNavItems = navItems.filter(
    (item) => !item.requiresAuth || isAuthenticated,
  );

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed w-full top-0 left-0 z-50">
      <div className="flex flex-wrap items-center justify-between">
        {/* Logo/Brand */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate("home")}
        >
          <span className="self-center text-xl font-semibold whitespace-nowrap">
            JobSync
          </span>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="items-center hidden md:flex">
          <ul className="flex flex-row space-x-8">
            {filteredNavItems.map((item) => (
              <li key={item.route}>
                <a
                  href="#"
                  className="font-medium text-gray-500 cursor-pointer hover:text-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.route as any);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Profile section */}
        <div className="relative flex items-center">
          {isAuthenticated ? (
            <div className="flex items-center ml-4">
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:ring-4 focus:ring-gray-200"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-primary">
                  {user?.firstName?.[0]?.toUpperCase() || <User size={20} />}
                </div>
              </button>

              {/* Profile dropdown menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 z-50 w-48 mt-2 bg-white rounded-lg shadow-lg top-full">
                  <div className="px-4 py-2 text-sm text-gray-700">
                    <div className="mb-2 font-medium truncate">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs font-medium text-gray-500 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <ul className="py-1">
                    <li>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("profile");
                          setIsProfileMenuOpen(false);
                        }}
                      >
                        Profile
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                      >
                        Sign out
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate("login")}
              className="ml-4"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={cn("md:hidden", isMobileMenuOpen ? "block" : "hidden")}>
        <ul className="flex flex-col py-4 space-y-4">
          {filteredNavItems.map((item) => (
            <li key={item.route}>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.route as any);
                  setIsMobileMenuOpen(false);
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
          {isAuthenticated && (
            <li>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("profile");
                  setIsMobileMenuOpen(false);
                }}
              >
                Profile
              </a>
            </li>
          )}
          {isAuthenticated && (
            <li>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              >
                Sign out
              </a>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
