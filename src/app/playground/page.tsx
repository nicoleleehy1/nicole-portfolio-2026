import type { Metadata } from "next";
import { Playground } from "../../components/playground/playground";

export const metadata: Metadata = { title: "Playground" };

export default function PlaygroundPage() {
  return (
    <section className="section scrim pg-section" data-content data-exclude>
      <h1 className="page-title">playground ⋆˙⟡</h1>
      <p className="pg-intro pg-intro--small">
        small simulations i build to understand how simple rules turn into complex behavior!
      </p>
      <Playground />
    </section>
  );
}
