import s from "./case-study.module.css";

// The Aster case study, rendered inside the project popup in place of "What I did".
const sections = [
  ["goal", "What I set out to build"],
  ["problem", "The problem, stated precisely"],
  ["features", "What it does"],
  ["architecture", "Architecture"],
  ["approach", "Approach: the model and the ranking rule"],
  ["research", "Research behind it"],
  ["results", "Experiments and results"],
  ["conclusion", "What all of it concluded"],
  ["limits", "Limits"],
  ["next", "What I would do next"],
];

export function AsterCaseStudy() {
  return (
    <div className={s.doc}>
      <dl className={s.meta}>
        <dt>Role</dt>
        <dd>Sole designer, researcher and engineer</dd>
        <dt>Status</dt>
        <dd>Working system, evaluated retrospectively on public data. No prospective lab result yet.</dd>
        <dt>Scale</dt>
        <dd>10 protein targets · 6,000+ paired retrospective replays · 9 milestones</dd>
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

      {/* 1 ----------------------------------------------------------------- */}
      <div className={s.section} id="goal">
        <h2 className={s.h2}>What I set out to build</h2>
        <p>
          A drug discovery campaign is a long sequence of small, expensive choices. A team can afford to
          assay maybe eight compounds this month out of hundreds they could have made. Six months and
          several rounds later, the record of why those eight were chosen is usually gone: it lived in a
          meeting, a spreadsheet tab, or somebody’s head.
        </p>
        <p>
          That bothered me more than the prediction problem did. Plenty of software will rank molecules
          for you. Almost none of it writes down the ranking, the rule that produced it, and the
          prediction it made, in a form that can be checked against what the assay actually returned.
        </p>
        <p className={s.callout}>
          My goal: make the decision, not the prediction, the thing the system stores — for any assay and
          any endpoint, not just the one benchmark I happened to start with.
        </p>
        <p>
          Two design commitments follow from that. First, a campaign has to <strong>declare what it is
          measuring</strong> rather than assume it: an endpoint name, a unit, and a direction (higher is
          better, or lower is better). Second, every round has to store the
          {" "}<strong>whole ranked slate</strong>, including the compounds that were rejected, because
          after the round the pool has changed and the model has been refit, and that counterfactual view
          is unrecoverable.
        </p>
      </div>

      {/* 2 ----------------------------------------------------------------- */}
      <div className={s.section} id="problem">
        <h2 className={s.h2}>The problem, stated precisely</h2>
        <p>
          The technical task underneath the product is <strong>low-data batch selection</strong>. You
          start with 32 to 64 compounds whose activity against one protein target has been measured, and
          a pool of a few hundred untested candidates. Each round, pick 8 to send to the assay. The
          measurement comes back, the model refits, and you pick again. Five rounds, 40 picks.
        </p>
        <p>
          The metric I report is <strong>top-decile recovery</strong>: how many of the pool’s strongest
          10% of compounds were found within those 40 picks, with the decile cutoff computed only after
          the replay has finished, so the selector never sees it. Every comparison is paired — the arms
          share the same starting set, the same pool, the same held-out audit set and the same random
          seed — so the difference between arms is the quantity of interest, not the variance of the
          dataset.
        </p>
        <p>
          Everything reported here is <strong>retrospective</strong>. The labels already exist in public
          benchmark collections; the harness hides them and reveals one committed batch at a time, in the
          order the selector asked for them.
        </p>
      </div>

      {/* 3 ----------------------------------------------------------------- */}
      <div className={s.section} id="features">
        <h2 className={s.h2}>What it does</h2>

        <h3 className={s.h3}>A campaign that runs in rounds</h3>
        <p>
          You bring a CSV of measured compounds and a CSV of candidates. Aster declares the endpoint,
          fits its model, and proposes the next batch with a stated reason per pick. You run the assay,
          import the results, and it refits for the next round. The whole lifecycle lives in a single
          SQLite file per campaign, as an append-only event log plus a snapshot per round.
        </p>

        <figure className={s.figure}>
          <img src="/projects/aster/campaign-workspace.jpg" alt="The Aster campaign workspace: a predict, prioritize, test, learn header, a candidate landscape plot, the selected compound with its prediction and nearest analogue, the committed batch, the compound library and the decision history." />
          <figcaption className={s.caption}>
            The campaign workspace at the end of round 2 of a public replay on the dopamine transporter:
            48 measured, 112 untested, two completed rounds, Morgan + ridge as the reference model. The
            candidate landscape plots predicted activity against similarity to the nearest measured
            compound, and the panel says so in as many words — similarity is proximity, not confidence.
          </figcaption>
        </figure>

        <h3 className={s.h3}>A decision record, not a prediction log</h3>
        <p>
          Each round stores the full ranked slate with, for every candidate, its predicted value, its
          rank, the nearest already-measured compound and the Tanimoto similarity to it, and whether it
          was chosen, passed over, locked in by hand or explicitly excluded. Beside it goes the
          acquisition policy that produced the ranking, the training-data hash, and the model
          coefficients. A reading module, <code>aster/decisions.py</code>, serves this over HTTP and joins
          each pick to its basis at the time and to its result, if a result has since arrived.
        </p>

        <figure className={s.figure}>
          <img src="/projects/aster/committed-batch.jpg" alt="The committed batch table: eight compounds with predicted pKi, similarity to the nearest measured compound, and the selection reason for each." />
          <figcaption className={s.caption}>
            The committed batch as it is stored: a prediction, a similarity and a stated selection reason
            per pick, saved at decision time rather than recomputed on the way out.
          </figcaption>
        </figure>

        <figure className={`${s.figure} ${s.figNarrow}`}>
          <img src="/projects/aster/decision-history.jpg" alt="The decision history panel listing two rounds, each with the number of measurements it was trained on and its results, under the heading Decisions you can trace." />
          <figcaption className={s.caption}>
            Each round keeps its own training snapshot, model, original predictions and selection
            reasons. This is the part that makes the later question answerable.
          </figcaption>
        </figure>

        <h3 className={s.h3}>“Were we right?” as a computed view</h3>
        <p>
          For every pick that has come back, the record already holds the prediction that justified it, so
          the system can report signed error, how many picks landed within half a log unit, and how many
          cleared the campaign’s own activity threshold. Nothing there is recomputed from a fresh model
          fit; it is read from what was stored, which is the whole point.
        </p>

        <figure className={s.figure}>
          <img src="/projects/aster/decision-replay.jpg" alt="The structure and decision replay view: the experimental protein complex in 3D, nearby residues with distances, the recorded campaign, the committed batch, a decision timeline, and a prediction-to-observation table." />
          <figcaption className={s.caption}>
            The replay view, which reads saved artefacts and runs nothing: the five steps of round 2,
            the committed batch, and every pick’s prediction next to the measurement that came back,
            with a batch mean absolute error of 0.91 log units. Playback does not retrain or change the
            campaign.
          </figcaption>
        </figure>

        <h3 className={s.h3}>Structural context, kept out of the ranking</h3>
        <p>
          Candidates can be docked into an experimental protein structure with AutoDock Vina and overlaid
          on the reference ligand in the browser, with the nearby residues listed as shared or new
          contacts. It is shown for inspection and explicitly not used as a ranking feature — section 7
          explains why that restraint is a measured decision rather than a missing one.
        </p>

        <figure className={s.figure}>
          <img src="/projects/aster/docking-overlay.jpg" alt="A docked candidate pose overlaid in green on the violet reference ligand inside the dopamine transporter pocket, with a list of geometric contacts marked shared or new." />
          <figcaption className={s.caption}>
            A docked candidate (green) overlaid on the experimental reference ligand (violet) in the
            dopamine transporter pocket, with its Vina pose at −8.03 kcal/mol. The panel states its own
            limits: protein-only rigid docking, ions omitted from scoring, redocking passed but
            cross-docking untested, and the score is not a potency — recommendations are unchanged by it.
          </figcaption>
        </figure>
      </div>

      {/* 4 ----------------------------------------------------------------- */}
      <div className={s.section} id="architecture">
        <h2 className={s.h2}>Architecture</h2>
        <p>
          One Python package does the science and owns the data; a Next.js workspace reads it. There is no
          hidden state between them — the dashboard shows what the store holds.
        </p>

        <div className={s.arch}>
          <div className={s.layer}>
            <p className={s.layerName}>Interface · Next.js, React, TypeScript</p>
            <div className={s.chips}>
              <span className={s.chip}>/dashboard</span>
              <span className={s.chip}>/replay</span>
              <span className={s.chip}>Mol* · 3Dmol</span>
            </div>
            <p className={s.layerNote}>
              A local dashboard for running a campaign round by round, and a 3D replay of a past round
              against the experimental structure.
            </p>
          </div>

          <p className={s.flow}>↑ HTTP ↓</p>

          <div className={s.layer}>
            <p className={s.layerName}>API · FastAPI</p>
            <div className={s.chips}>
              <span className={s.chip}>aster/api.py</span>
              <span className={s.chip}>/campaigns/…/decisions</span>
              <span className={s.chip}>/decisions/review</span>
            </div>
            <p className={s.layerNote}>
              Campaign lifecycle endpoints plus the decision-record reads. The decision endpoints compute
              nothing new; they join stored rows.
            </p>
          </div>

          <p className={s.flow}>↑ ↓</p>

          <div className={s.layer}>
            <p className={s.layerName}>Core · Python</p>
            <div className={s.chips}>
              <span className={s.chip}>campaign.py</span>
              <span className={s.chip}>acquisition.py</span>
              <span className={s.chip}>decisions.py</span>
              <span className={s.chip}>docking.py</span>
              <span className={s.chip}>evidence.py</span>
            </div>
            <p className={s.layerNote}>
              Campaign lifecycle and store, batch selection, the decision reader, Vina docking, and the
              literature corpus. Featurisation is RDKit; the model is scikit-learn.
            </p>
          </div>

          <p className={s.flow}>↑ ↓</p>

          <div className={s.layer}>
            <p className={s.layerName}>Research harness · Python</p>
            <div className={s.chips}>
              <span className={s.chip}>benchmark.py</span>
              <span className={s.chip}>experiment.py</span>
              <span className={s.chip}>evidence_supply.py</span>
              <span className={s.chip}>evidence_power.py</span>
            </div>
            <p className={s.layerNote}>
              The paired replay machinery, the oracle that reveals labels only for selected compounds, and
              the power accounting that says what a null result does and does not rule out.
            </p>
          </div>

          <p className={s.flow}>↑ ↓</p>

          <div className={s.layer}>
            <p className={s.layerName}>Storage · SQLite</p>
            <div className={s.chips}>
              <span className={s.chip}>one file per campaign</span>
              <span className={s.chip}>append-only events</span>
              <span className={s.chip}>round snapshots</span>
            </div>
            <p className={s.layerNote}>
              Correct for one researcher, and deliberately not generalised to shared storage until there
              is a second person sharing a record.
            </p>
          </div>
        </div>

        <p>
          Tests run with pytest; the research modules are configured from declarative JSON files so a
          study is re-runnable from its config rather than from a notebook.
        </p>
      </div>

      {/* 5 ----------------------------------------------------------------- */}
      <div className={s.section} id="approach">
        <h2 className={s.h2}>Approach: the model and the ranking rule</h2>
        <p>
          This is <strong>machine learning and active learning</strong>, not deep learning. Molecules are
          featurised as chirality-aware <strong>Morgan fingerprints</strong> — a bit vector recording
          which circular substructures appear around each atom, here radius 2 and 2,048 bits. On top sits
          a <strong>standardized ridge regression</strong>, a linear model with a penalty on large
          coefficients, which is what makes it usable at 32 labels. Candidates are ranked by predicted
          activity and the top 8 are taken, which is a <strong>greedy acquisition</strong> rule.
        </p>
        <p>
          I did not choose that out of conviction. I chose it as a baseline, and then every attempt to
          replace it lost. The honest framing of the architecture is that the modelling is deliberately
          boring so that the record around it can be the interesting part.
        </p>
        <p>
          One consequence worth stating: the interface shows <strong>similarity</strong> to the nearest
          measured compound, never a confidence score. I tested bootstrap disagreement as an uncertainty
          signal, and its ability to flag large errors came out at AUROC 0.477 — worse than a coin flip.
          A number that does not predict error should not be displayed as if it does.
        </p>
      </div>

      {/* 6 ----------------------------------------------------------------- */}
      <div className={s.section} id="research">
        <h2 className={s.h2}>Research behind it</h2>

        <h3 className={s.h3}>Is anyone already doing this?</h3>
        <p>
          Before committing to the decision record I surveyed the field across three tracks: commercial
          platforms, open-source tooling, and the active-learning literature. Three absences held up.
        </p>
        <ul className={s.list}>
          <li>
            <strong>No vendor sells decision provenance as a category.</strong> The closest is Certara and
            Chemaxon’s Design Hub, which captures design ideas but makes no claim about linking a
            prediction to the result that later tested it. Optibrium’s Cerella runs a were-we-right
            analysis, but as a one-off during sales qualification rather than as a standing feature.
          </li>
          <li>
            <strong>No open-source project records the rejected slate</strong> alongside the chosen batch.
            Selection tools emit the batch; the counterfactual ranking is discarded.
          </li>
          <li>
            <strong>No published study measures how often a recorded prediction is later checked</strong>
            {" "}against its result. That is the absence that bothers me most, because it means the
            practice I am building infrastructure for has never been measured.
          </li>
        </ul>
        <p>
          The survey also changed two technical defaults. Greedy acquisition turns out to be
          <strong> contested rather than settled</strong>: one 2026 study found uncertainty sampling
          decisively better on a three-million-molecule docking-scored pool, while another found greedy
          best and the classic exploration rules no better than random. Which rule wins depends on pool
          breadth, the metric, and whether labels are measured or docked — so the system logs which policy
          produced each batch instead of hard-coding one. And a bare point estimate is indefensible for an
          auditability product, because cross-source aggregation of the same quantity costs about 0.68 log
          units of noise against 0.17–0.29 within one lab.
        </p>

        <h3 className={s.h3}>What I borrowed instead of inventing</h3>
        <ul className={s.list}>
          <li>
            <strong>Open Reaction Database</strong> — its schema for closed-unit quantities, where a value
            never travels without its unit.
          </li>
          <li>
            <strong>Ax and BayBE</strong> — the separation of recommendations from measurements as
            distinct record types.
          </li>
          <li>
            <strong>The Bluesky document model</strong> — an append-only typed event stream as the
            experiment’s source of truth.
          </li>
          <li>
            <strong>REINVENT 4</strong> — named, versioned scoring components, so a score can be traced to
            the component and version that produced it.
          </li>
          <li>
            <strong>RO-Crate and W3C PROV</strong> — provenance as typed links, so a decision record can
            be archived and read by something other than this application.
          </li>
          <li>
            <strong>RDKit, scikit-learn and AutoDock Vina</strong> for the chemistry, modelling and
            docking themselves, with public benchmark collections (ChEMBL-derived MoleculeACE tasks and
            the ASAP/Polaris/OpenADMET set) as the evaluation data.
          </li>
        </ul>
      </div>

      {/* 7 ----------------------------------------------------------------- */}
      <div className={s.section} id="results">
        <h2 className={s.h2}>Experiments and results</h2>
        <p>
          Nine milestones, each one a question with a pre-registered threshold for what would count as an
          answer. The pattern is the finding, so the negatives are in the table with the positives.
        </p>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Question</th>
                <th>Result</th>
                <th>Number</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Does model-guided selection beat picking at random?</td>
                <td className={s.ok}>Yes</td>
                <td className={s.num}>36.0 vs 8.7 hits; 10 of 10 paired runs</td>
              </tr>
              <tr>
                <td>Does it hold on targets the model was never developed on?</td>
                <td className={s.ok}>Yes</td>
                <td className={s.num}>6,000+ paired replays, 10 targets</td>
              </tr>
              <tr>
                <td>Does a pretrained molecular encoder beat fingerprints?</td>
                <td className={s.no}>No</td>
                <td className={s.num}>18.67 vs 15.50 per 40 picks</td>
              </tr>
              <tr>
                <td>Does fine-tuning that encoder rescue it?</td>
                <td className={s.no}>No</td>
                <td className={s.num}>still behind at 32–104 labels</td>
              </tr>
              <tr>
                <td>Does sampling where the model is uncertain help?</td>
                <td className={s.no}>No</td>
                <td className={s.num}>14.17 vs 14.29 for greedy</td>
              </tr>
              <tr>
                <td>Is that uncertainty at least a usable warning signal?</td>
                <td className={s.no}>No</td>
                <td className={s.num}>AUROC 0.477 for large error</td>
              </tr>
              <tr>
                <td>Does docking into a real structure reproduce the known pose?</td>
                <td className={s.ok}>Yes</td>
                <td className={s.num}>4 of 5 redocks under 2 Å RMSD</td>
              </tr>
              <tr>
                <td>Do published measurements improve the picks?</td>
                <td className={s.no}>No</td>
                <td className={s.num}>+0.03 per 40 picks (CI −0.34 to +0.39)</td>
              </tr>
              <tr>
                <td>Would they, if there were enough of them and they were precise?</td>
                <td className={s.ok}>Yes</td>
                <td className={s.num}>+2.80 at 150 structures, donor precision</td>
              </tr>
              <tr>
                <td>Does that survive literature-grade value noise?</td>
                <td className={s.no}>No</td>
                <td className={s.num}>−0.99 at 0.68 log units of noise</td>
              </tr>
            </tbody>
          </table>
        </div>

        <figure className={s.figure}>
          <img src="/projects/aster/discovery-curves.jpg" alt="Two line charts. Left: new hits found against additional assays acquired, with model-guided selection rising to 36 and random selection to under 9. Right: mean absolute error on an untouched test partition, nearly flat for both arms." />
          <figcaption className={s.caption}>
            The first milestone, ten paired seeds. Left: model-guided selection finds 36.0 strong
            compounds over 40 assays against 8.7 for random picking. Right: the same runs scored for
            predictive accuracy on a partition nobody touched, where the two arms are indistinguishable
            and the guided one is very slightly worse. Choosing well and predicting well are not the same
            thing, and only the first is what the system claims.
          </figcaption>
        </figure>

        <h3 className={s.h3}>The experiment that explained the rest</h3>
        <p>
          The literature result was first reported as a null and attributed to short supply: the corpus
          only had a dozen usable structures the replay had not already seen. That explanation was a
          guess, so I rebuilt the study to test it. I made supply a{" "}
          <strong>controlled variable</strong> — withhold measurements from the replay task, then hand
          them back as external evidence — which gives an experiment that can distinguish “not enough
          evidence” from “evidence does not help”. Nine targets, two protocols, two donor regimes, three
          supply levels, eight seeds: 864 paired cases per arm.
        </p>
        <p>
          Supply does bind. At 12 supplied structures the gain is +0.29; at 50 it is +2.35; at 150 it is
          +2.80, and seven of nine targets improve. A control that keeps the extra rows but permutes their
          values costs −8.54, so this is not an artefact of simply having more training rows.
        </p>
        <p>
          Then I added noise at the level a literature corpus actually carries, 0.68 log units between
          sources reporting the same quantity, and the gain inverted to −0.99. At same-lab precision, 0.29
          log units, about two thirds of it survives.
        </p>
        <p className={s.callout}>
          So ranking-grade external evidence means roughly fifty or more unseen structures measured at one
          lab’s precision on the campaign’s own endpoint — a collaborator’s unpublished assay history, not
          a public corpus. Published values still belong in the system, attached to the decision with
          their provenance, where a person reads them. They do not belong averaged into a prediction.
        </p>
        <p>
          The same retest also priced an experiment I then chose not to run. The standard deviation of
          paired differences is 5.26 compounds, so detecting a one-compound gain at 80% power needs about
          219 paired cases. A second docking pocket on one protein would yield 16, enough to detect only
          about +3.9. That is not an experiment, so I did not run it.
        </p>

        <figure className={s.figure}>
          <img src="/projects/aster/model-comparison.jpg" alt="Grouped bar charts over three Ki targets, two protocols and two starting label counts, comparing Morgan with random forest, random selection, Morgan with ridge, and CheMeleon with ridge." />
          <figcaption className={s.caption}>
            The broader evaluation: three Ki targets, a published and a scaffold-transfer protocol, 32 and
            64 starting labels, paired seeds. Morgan + ridge (green) is at or above the pretrained
            CheMeleon encoder (orange) in most panels, and every model arm is far above random (grey).
            The error bars are one seed standard deviation, and they are wide — which is why the
            conclusion rests on thousands of paired cases rather than on any single panel.
          </figcaption>
        </figure>
      </div>

      {/* 8 ----------------------------------------------------------------- */}
      <div className={s.section} id="conclusion">
        <h2 className={s.h2}>What all of it concluded</h2>
        <p>
          Five separate attempts to make the model smarter failed: a pretrained encoder frozen, the same
          encoder fine-tuned, uncertainty-driven acquisition, a diversity penalty inside the batch, and
          appending published measurements. Read one at a time that is a string of disappointments. Read
          together they have a single cause.
        </p>
        <p className={s.callout}>
          At a few dozen labels, what limits the system is signal per label against the noise that label
          carries. A least-squares fit cannot discount a noisy row, so anything that adds rows without
          adding a way to down-weight them loses, however sophisticated it is.
        </p>
        <p>
          That is a prediction, not just a summary: methods that can discount a noisy input — a
          heteroscedastic or reliability-weighted likelihood, evidence used as a filter rather than as
          training rows, uncertainty that is actually calibrated — are the ones worth testing next.
          Methods that add capacity without adding a way to discount noise are not.
        </p>
        <p>
          It is also the argument for the product. If model sophistication is not where the headroom is,
          then the useful thing to build is the layer that makes each decision checkable: what was
          available, what was chosen, on what basis, and what came back.
        </p>
      </div>

      {/* 9 ----------------------------------------------------------------- */}
      <div className={s.section} id="limits">
        <h2 className={s.h2}>Limits</h2>
        <ul className={s.list}>
          <li>
            Everything is retrospective, on public benchmark data, with pools of hundreds rather than
            millions. There is no prospective lab result behind any number here.
          </li>
          <li>
            The headline evidence result was <strong>null</strong>. The noise analysis that explains it was
            decided after the main result had been seen, and I label it post-hoc wherever it appears.
          </li>
          <li>
            The donor measurements in the supply study are cleaner than any real corpus, so every positive
            figure from it is an <strong>upper bound</strong>, not a forecast.
          </li>
          <li>
            The 4× figure is one target. The thousands of replays support the approach in general; that
            single number should not be read as the expected gain.
          </li>
          <li>
            <strong>No temporal holdout.</strong> These datasets carry no measurement dates, so “was this
            decision right at the time?” — the exact claim the record exists to support — is a mechanism I
            can describe but have not yet demonstrated.
          </li>
          <li>
            Nine of the ten targets measure the same kind of quantity. “Any assay” is a design goal that
            the data model now supports, not a tested claim.
          </li>
          <li>
            <strong>Censored values are unsupported.</strong> An assay reporting “greater than 10 µM” is a
            confirmed negative, and today it either becomes a fake point value or is dropped.
          </li>
        </ul>
      </div>

      {/* 10 ---------------------------------------------------------------- */}
      <div className={s.section} id="next">
        <h2 className={s.h2}>What I would do next</h2>
        <ul className={s.list}>
          <li>
            <strong>Censored labels</strong> as a structured relation, value and unit, propagating into
            both the record and a censored likelihood. This is ahead of every fancier idea in the queue.
          </li>
          <li>
            <strong>A temporal holdout</strong> on a dated measurement source, which is the only thing that
            would answer the question the record is built around.
          </li>
          <li>
            <strong>A reliability-weighted likelihood</strong>, so a 0.68-log-unit literature value counts
            for less than a same-lab measurement instead of being excluded outright.
          </li>
          <li>
            <strong>A readable profile instead of one blended number.</strong> Each endpoint in its own
            unit with its uncertainty, marked measured, predicted or untested against its own criterion,
            with the only scalar being the probability of meeting the whole profile.
          </li>
          <li>
            <strong>Count fingerprints and a second model family</strong> (TabPFN on pretrained features),
            the two cheapest remaining shots at the model side.
          </li>
        </ul>
        <p className={s.footerNote}>
          Written up from the project’s own results documents and pre-registered study configs. The
          interface figures are the repository’s own verification captures of the running application on
          its bundled public example (MoleculeACE CHEMBL238 Ki, dopamine transporter), where outcomes
          were already public and were revealed one committed batch at a time. The result figures are the
          plots the study scripts produced.
        </p>
      </div>
    </div>
  );
}
