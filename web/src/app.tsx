import Router from "preact-router";
import { Layout } from "./components/Layout";

export function App() {
  return (
    <Router>
      <Layout path="/" pageSlug="index" />
      <Layout path="/:slug*" />
    </Router>
  );
}
