import s from "./case-study.module.css";

// The CodeMRI case study, rendered inside the project popup in place of "What I did".
// Facts come from the CodeMRI README and ROADMAP.
const sections = [
  ["cm-goal", "What I set out to build"],
  ["cm-features", "What it does"],
  ["cm-architecture", "Architecture"],
  ["cm-how", "How it works"],
  ["cm-tests", "Testing"],
  ["cm-limits", "Limits"],
  ["cm-next", "What I would do next"],
];

export function CodeMRICaseStudy() {
  return (
    <div className={s.doc}>
      <dl className={s.meta}>
        <dt>Built at</dt>
        <dd>HackMIT 2026</dd>
        <dt>Status</dt>
        <dd>Working VS Code extension and MCP server, run locally. No agent benchmark yet.</dd>
        <dt>Languages</dt>
        <dd>Java, TypeScript/JavaScript and Python analysis</dd>
      </dl>

      <nav className={s.contents} aria-label="Contents">
        <ol>
          {sections.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className={s.section} id="cm-goal">
        <h2 className={s.h2}>What I set out to build</h2>
        <p>
          Every time a coding agent starts a task, it rebuilds its picture of the repository from scratch:
          listing folders, opening files, following imports. That work is thrown away when the task ends, and
          a person reviewing the change has no view of it either.
        </p>
        <p className={s.callout}>
          The goal: build that structural knowledge once, keep it, and make it useful to two consumers —
          developers in VS Code, and coding agents through MCP.
        </p>
        <p>
          For a developer that means an architecture view beside the source, backed by evidence from the
          code. For an agent it means a focused context pack for the change it is about to make, sized to a
          token budget.
        </p>
      </div>

      <div className={s.section} id="cm-features">
        <h2 className={s.h2}>What it does</h2>

        <h3 className={s.h3}>A map of the system, drawn from the code</h3>
        <p>
          Analyzing a repository produces a system map specific to that repository: subsystem groups,
          components, storage, and labelled connections, each linked to the source that justifies it. You can
          drill from repository to component to module to file to a single function, and click any
          connection to see its citations.
        </p>

        <h3 className={s.h3}>Function cards and call paths</h3>
        <p>
          Classes and functions open as cards listing parameters, local variables, calls, return values and
          types. Double-clicking a function shows its callers and callees one hop out, and you can keep going
          deeper and step back. Moving the cursor in the editor highlights the matching node, and every node
          links back to its exact line.
        </p>

        <h3 className={s.h3}>Change impact and context packs</h3>
        <p>
          Describe a change and CodeMRI estimates its blast radius: the symbols that match, plus up to three
          hops of callers, each with a reason. From there it compiles a context pack of the relevant symbols,
          their callers and direct dependencies, packed into a real token budget, and lists what it left out.
        </p>

        <h3 className={s.h3}>Reviewing agent changes</h3>
        <p>
          You can send a prompt to Codex from the panel. Each run happens in a temporary copy of the repo, so
          your files are untouched until you approve. The proposed changes are then shown on the graph:
          changed areas outlined in yellow, with a file-by-file diff you approve or discard.
        </p>

        <h3 className={s.h3}>Tools for agents</h3>
        <p>
          The same graph is served over MCP with seven tools: <code>analyze_repository</code>,{" "}
          <code>get_architecture</code>, <code>get_symbol</code>, <code>find_callers</code>,{" "}
          <code>find_callees</code>, <code>impact_analysis</code> and <code>compile_agent_context</code>. They
          read code; they never run it or apply patches.
        </p>
      </div>

      <div className={s.section} id="cm-architecture">
        <h2 className={s.h2}>Architecture</h2>

        <div className={s.arch}>
          <div className={s.layer}>
            <p className={s.layerName}>Extension · VS Code, TypeScript</p>
            <div className={s.chips}>
              <span className={s.chip}>webview graph</span>
              <span className={s.chip}>ELK layout</span>
              <span className={s.chip}>source navigation</span>
            </div>
            <p className={s.layerNote}>
              Renders the graph locally as SVG with pan, zoom and search, and keeps it in sync with the editor.
            </p>
          </div>

          <p className={s.flow}>↑ local HTTP ↓</p>

          <div className={s.layer}>
            <p className={s.layerName}>API · FastAPI</p>
            <div className={s.chips}>
              <span className={s.chip}>/analyze</span>
              <span className={s.chip}>/impact</span>
              <span className={s.chip}>/context</span>
              <span className={s.chip}>/preview</span>
            </div>
            <p className={s.layerNote}>Loopback only, with the analyzed folder restricted to an allowed root.</p>
          </div>

          <p className={s.flow}>↑ ↓</p>

          <div className={s.layer}>
            <p className={s.layerName}>Engine · Python</p>
            <div className={s.chips}>
              <span className={s.chip}>Tree-sitter</span>
              <span className={s.chip}>symbols + edges</span>
              <span className={s.chip}>impact</span>
              <span className={s.chip}>context compiler</span>
            </div>
            <p className={s.layerNote}>
              Parses source into a graph of symbols and typed edges, then answers impact and context queries.
            </p>
          </div>

          <p className={s.flow}>↑ ↓</p>

          <div className={s.layer}>
            <p className={s.layerName}>Storage · SQLite</p>
            <div className={s.chips}>
              <span className={s.chip}>working snapshot</span>
              <span className={s.chip}>reviewed baseline</span>
            </div>
            <p className={s.layerNote}>
              Shared by the API and the MCP server, so developers and agents read the same graph.
            </p>
          </div>
        </div>
      </div>

      <div className={s.section} id="cm-how">
        <h2 className={s.h2}>How it works</h2>

        <h3 className={s.h3}>The graph</h3>
        <p>
          Tree-sitter parses each file into an AST, and the engine pulls out functions, classes, methods,
          interfaces and types. Edges are typed: calls point from caller to callee, imports from importer to
          imported module, and containment from module to symbol. Every node keeps its path, line, column and
          a source snippet, so anything on screen can be traced back to code.
        </p>

        <h3 className={s.h3}>Resolving Java calls</h3>
        <p>
          For Java, calls are resolved by the receiver&apos;s type (fields, parameters, locals and static
          references), the method name and the number of arguments, including basic inherited methods. It also
          picks up HTTP routes, served HTML and filesystem access, which is what lets it draw a real system
          map of a Java service rather than a list of files.
        </p>

        <h3 className={s.h3}>Snapshots and review</h3>
        <p>
          Graphs are saved in SQLite as a working snapshot and a last-reviewed baseline. Reanalyzing updates
          the working snapshot; comparing the two shows which symbols and connections changed since you last
          marked the graph reviewed.
        </p>

        <h3 className={s.h3}>Optional AI architecture</h3>
        <p>
          Local analysis needs no API key. If you want higher-level grouping, an optional step sends sampled
          source to an OpenAI model, then validates every ID, path and citation it returns before saving. AI
          relationships are marked as inferred, because a valid citation doesn&apos;t prove the interpretation
          is right.
        </p>
      </div>

      <div className={s.section} id="cm-tests">
        <h2 className={s.h2}>Testing</h2>
        <p>
          Automated tests cover the demo call chain, import aliases, reverse impact, token budgets,
          persistence, TSX and UTF-16 positions, parse diagnostics, the API round trip, a real MCP handshake
          and tool call, the extension&apos;s navigation bridge, and evidence-backed edge types. The VS Code demo
          itself is the manual acceptance check.
        </p>
      </div>

      <div className={s.section} id="cm-limits">
        <h2 className={s.h2}>Limits</h2>
        <ul className={s.list}>
          <li>
            Tree-sitter gives syntax, not types. Re-exports, aliases, dynamic dispatch and callbacks are not
            resolved reliably, and member calls are reported as unresolved.
          </li>
          <li>Impact analysis is a heuristic, not a guarantee that a change is safe.</li>
          <li>
            Context retrieval uses lexical matching and packs whole symbols greedily; it doesn&apos;t prove the
            pack is complete.
          </li>
          <li>
            There is no agent benchmark yet. Token savings are only meaningful against a real baseline agent
            run, and that comparison hasn&apos;t been done.
          </li>
          <li>Large repositories will need incremental indexing and graph virtualization.</li>
        </ul>
      </div>

      <div className={s.section} id="cm-next">
        <h2 className={s.h2}>What I would do next</h2>
        <ul className={s.list}>
          <li>Full Java type and overload resolution, and the TypeScript language service for TS.</li>
          <li>Incremental indexing with stable symbol identities.</li>
          <li>
            A benchmark: the same agent on the same tasks with and without CodeMRI, measuring tokens, tool calls,
            time and whether the tests pass.
          </li>
          <li>Impacted-test selection, and a patch → test → graph refresh loop for agents.</li>
          <li>Architecture diffs for pull requests.</li>
        </ul>
      </div>
    </div>
  );
}
