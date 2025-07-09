import React, { useState, useContext } from "react";
import { Button } from "./ui/button";
import { ThemeContext } from "@/providers/theme-provider"; // Corrected import path
import { cn } from "../lib/utils"; // Import cn utility

// Lucide React Icons (simulated)
const Sun = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M6.34 17.66l-1.41 1.41" />
    <path d="M19.07 4.93l-1.41 1.41" />
  </svg>
);

const Moon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const ModeToggle: React.FC = () => {
  const { setTheme } = useContext(ThemeContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-popover ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setTheme("light");
                setDropdownOpen(false);
              }}
            >
              Light
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setTheme("dark");
                setDropdownOpen(false);
              }}
            >
              Dark
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setTheme("system");
                setDropdownOpen(false);
              }}
            >
              System
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
