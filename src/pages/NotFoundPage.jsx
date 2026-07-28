import { ArrowLeft, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="not-found">
      <FileQuestion />
      <h2>Page not found</h2>
      <p>The requested MedLink workspace does not exist.</p>
      <Link className="button button-primary" to="/">
        <ArrowLeft />
        Return to dashboard
      </Link>
    </section>
  );
}
