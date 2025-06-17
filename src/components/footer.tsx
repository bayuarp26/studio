interface FooterProps {
  copyrightName: string;
  year: number;
}

export default function Footer({ copyrightName, year }: FooterProps) {
  return (
    <footer className="bg-footer text-footer-foreground text-center p-6 mt-10">
      <p>&copy; {year} {copyrightName}. All rights reserved.</p>
    </footer>
  );
}
