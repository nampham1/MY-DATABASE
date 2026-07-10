/**
 * fiche.js
 * Vue détail d'une œuvre.
 * Appelée par router.js via afficherFiche(id, APP).
 */

function afficherFiche(id, app) {
  const conteneur = document.getElementById("app");

  const oeuvre = app.oeuvres.find(o => o.id === id);
  if (!oeuvre) {
    conteneur.innerHTML = "<p class='vide'>Œuvre introuvable.</p>";
    return;
  }

  // ─── Images ─────────────────────────────────────────────────────────────────
  const images = app.images.filter(img => img.oeuvre_id === id);
  const imagesHTML = images.map(img => {
    const provisoire = img.img_temp
      ? `<span class="img-provisoire">Prise de vue provisoire</span>`
      : "";
    const legende = img.legende
      ? `<figcaption>${img.legende}${provisoire}</figcaption>`
      : provisoire ? `<figcaption>${provisoire}</figcaption>` : "";
    return `
      <figure>
        <img src="images/${img.chemin}" alt="${oeuvre.titre}">
        ${legende}
      </figure>`;
  }).join("");

  // ─── Technique / support  ───────────────────────────────────────────
  const morceaux = [];

  if (oeuvre.technique) {
    morceaux.push(
      `<a href="index.html?technique=${oeuvre.technique.libelle}">${oeuvre.technique.libelle}</a>`
    );
  }
  if (oeuvre.support) {
    morceaux.push(
      `sur <a href="index.html?support=${oeuvre.support.libelle}">${oeuvre.support.libelle}</a>`
    );
  }

  const ligneTechnique = morceaux.join(" ");

  const infosMaterielles = [];

  if (oeuvre.largeur && oeuvre.hauteur) {
    infosMaterielles.push(
      `${oeuvre.largeur} × ${oeuvre.hauteur} cm`
    );
  }

  if (oeuvre.duree) {
    infosMaterielles.push(
      `${oeuvre.duree} s`
    );
  }

  const dimensions = infosMaterielles.length
    ? `<p>${infosMaterielles.join(" — ")}</p>`
    : "";

  // ─── themes ───────────────────────────────────────────────────────────────────
  const themesIds = app.oeuvre_themes
    .filter(r => r.oeuvre_id === id)
    .map(r => r.theme_id);
  const themes = app.themes.filter(t => themesIds.includes(t.id));
  const themesHTML = themes.map(t =>
    `<a class="themes" href="index.html?theme=${t.id}">${t.libelle}</a>`
  ).join(" ");

  // ─── Série ──────────────────────────────────────────────────────────────────
  const serieRel = app.oeuvre_series.find(r => r.oeuvre_id === id);
  const serie = serieRel ? app.series.find(s => s.id === serieRel.serie_id) : null;
  const serieHTML = serie
    ? `<p class="serie">Série : <a href="index.html?vue=serie&id=${serie.id}">${serie.titre}</a></p>`
    : "";

  // ─── Relations entre œuvres ─────────────────────────────────────────────────
  const relationsOeuvre = [
    // sens direct : cette œuvre est la source
    ...app.relations_oeuvres
      .filter(r => r.oeuvre_source_id === id)
      .map(r => {
        const cible = app.oeuvres.find(o => o.id === r.oeuvre_cible_id);
        const img = cible ? app.images.find(i => i.oeuvre_id === cible.id) : null;
        return cible ? { id: cible.id, titre: cible.titre, libelle: r.relation_directe, img: img?.chemin } : null;
      }),
    // sens inverse : cette œuvre est la cible
    ...app.relations_oeuvres
      .filter(r => r.oeuvre_cible_id === id)
      .map(r => {
        const source = app.oeuvres.find(o => o.id === r.oeuvre_source_id);
        const img = source ? app.images.find(i => i.oeuvre_id === source.id) : null;
        return source ? { id: source.id, titre: source.titre, libelle: r.relation_inverse, img: img?.chemin } : null;
      })
  ].filter(Boolean);

  const relationsHTML = relationsOeuvre.length ? `
    <section class="relations">
      <h2>Œuvres liées</h2>
      <div class="relations-liste">
        ${relationsOeuvre.map(r => `
          <a class="carte carte-relation" href="index.html?vue=oeuvre&id=${r.id}">
            ${r.img ? `<img src="images/${r.img}" alt="${r.titre}">` : ""}
            <div class="carte-meta">
              <span class="carte-relation-type">${r.libelle}</span>
              <span class="carte-titre">${r.titre}</span>
            </div>
          </a>`).join("")}
      </div>
    </section>` : "";

  // ─── Événements ─────────────────────────────────────────────────────────────
  const evtRels = app.oeuvre_evenements.filter(r => r.oeuvre_id === id);
  const evenementsOeuvre = evtRels.map(r => {
    const evt = app.evenements.find(e => e.id === r.evenement_id);
    const typeRel = app.termes.find(t => t.id === r.type_relation_id);
    const img = app.images_evenements.find(i => i.evenement_id === r.evenement_id);
    return evt ? { ...evt, libelle: typeRel?.libelle, img: img?.chemin } : null;
  }).filter(Boolean);

  const evenementsHTML = evenementsOeuvre.length ? `
    <section class="relations">
      <h2>Événements</h2>
      <div class="relations-liste">
        ${evenementsOeuvre.map(e => `
          <a class="carte carte-relation" href="index.html?vue=evenement&id=${e.id}">
            ${e.img ? `<img src="images/${e.img}" alt="${e.titre}">` : ""}
            <div class="carte-meta">
              <span class="carte-relation-type">${e.libelle || ""}</span>
              <span class="carte-titre">${e.titre}</span>
              <span class="carte-annee">${e.date_debut || ""}</span>
            </div>
          </a>`).join("")}
      </div>
    </section>` : "";


  // ─── Publications ─────────────────────────────────────────────────────────────
  const pubRels = app.oeuvre_publications.filter(
  r => r.oeuvre_id === id
  );
  const publicationsOeuvre = pubRels.map(r => {
    const pub = app.publications.find(
      p => p.id === r.publication_id
    );

    const img = app.images_publications.find(
      i => i.publication_id === r.publication_id
    );

    return pub
      ? {
          ...pub,
          libelle: r.relation_directe,
          img: img?.chemin
        }
      : null;
  }).filter(Boolean);

const publicationsHTML = publicationsOeuvre.length ? `
  <section class="relations">
    <h2>Publications</h2>
    <div class="relations-liste">
      ${publicationsOeuvre.map(p => `
        <a class="carte carte-relation" href="index.html?vue=publication&id=${p.id}">
          ${p.img ? `<img src="images/${p.img}" alt="${p.titre}">` : ""}
          <div class="carte-meta">
            <span class="carte-relation-type">${p.libelle || ""}</span>
            <span class="carte-titre">${p.titre}</span>
            <span class="carte-annee">${p.date || ""}</span>
          </div>
        </a>
      `).join("")}
    </div>
  </section>
` : "";

  // ─── Rendu final ────────────────────────────────────────────────────────────
  conteneur.innerHTML = `
    <a href="index.html" class="retour">← Retour à la galerie</a>
    <main class="fiche">
      <div class="images">${imagesHTML}</div>
      <div class="meta">
        <h1>${oeuvre.titre}</h1>
        <p class="cote">${oeuvre.cote || ""}</p>
        ${oeuvre.type_oeuvre ? `<p class="type-oeuvre"><a href="index.html?type_oeuvre=${oeuvre.type_oeuvre}">${oeuvre.type_oeuvre}</a></p>` : ""}
        <p>${oeuvre.annee || ""}${ligneTechnique ? " — " + ligneTechnique : ""}</p>
        ${dimensions}
        ${serieHTML}
        ${oeuvre.description ? `<p class="description">${oeuvre.description}</p>` : ""}
        <div class="themes">${themesHTML}</div>
        ${oeuvre.notes_creation ? `<section class="notes-creation"><h2>Notes de création</h2>
        <p>${oeuvre.notes_creation}</p></section>` : ""}
        ${oeuvre.url_externe ? `<p class="lien-externe"><a href="${oeuvre.url_externe}" target="_blank" rel="noopener">Voir en ligne ↗</a></p>` : ""}
        ${oeuvre.localisation ? `<p class="localisation">${oeuvre.localisation}</p>` : ""}
      </div>
    </main>
    ${relationsHTML}
    ${evenementsHTML}
    ${publicationsHTML}
  `;
}
