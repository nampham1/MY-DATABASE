/**
 * publication.js
 * Deux vues : index des publications + page d'une publication.
 * Appelées par router.js.
 */

function afficherIndexPublications(app) {
  const conteneur = document.getElementById("app");

  const pubsAvecOeuvres = app.publications.filter(p =>
    app.oeuvre_publications.some(r => r.publication_id === p.id)
  );

  const cartes = pubsAvecOeuvres.map(p => {
    const img = app.images_publications.find(i => i.publication_id === p.id);
    const imgHTML = img
      ? `<img src="images/${img.chemin}" alt="${p.titre}">`
      : "";
    const nb = app.oeuvre_publications.filter(r => r.publication_id === p.id).length;
    return `
      <a class="carte" href="index.html?vue=publication&id=${p.id}">
        ${imgHTML}
        <div class="carte-meta">
          <span class="carte-titre">${p.titre}</span>
          <span class="carte-annee">${nb} œuvre${nb > 1 ? "s" : ""}</span>
        </div>
      </a>`;
  }).join("");

  conteneur.innerHTML = `
    <a href="index.html" class="retour">← Retour à la galerie</a>
    <header class="page-header">
      <h1>Publications</h1>
      <p>Livres, revues et éditions</p>
    </header>
    <div class="galerie">
      ${cartes || '<p class="vide">Aucune publication.</p>'}
    </div>
  `;
}

function afficherPublication(id, app) {
  const conteneur = document.getElementById("app");

  const publication = app.publications.find(p => p.id === id);
  if (!publication) {
    conteneur.innerHTML = "<p class='vide'>Publication introuvable.</p>";
    return;
  }

  // ─── Images ─────────────────────────────────────────────────────────────────
  const imagesPub = app.images_publications.filter(i => i.publication_id === id);
  const imagesHTML = imagesPub.map(img => `
    <figure>
      <img src="images/${img.chemin}" alt="${publication.titre}">
      ${img.legende ? `<figcaption>${img.legende}</figcaption>` : ""}
    </figure>
  `).join("");

  // ─── Œuvres liées ───────────────────────────────────────────────────────────
  const oeuvreRels = app.oeuvre_publications.filter(r => r.publication_id === id);
  const oeuvresHTML = oeuvreRels.map(r => {
    const oeuvre = app.oeuvres.find(o => o.id === r.oeuvre_id);
    if (!oeuvre) return "";
    const imgTag = oeuvre.image_principale
      ? `<img src="images/${oeuvre.image_principale}" alt="${oeuvre.titre}">`
      : "";
    return `
      <a class="carte carte-relation" href="index.html?vue=oeuvre&id=${oeuvre.id}">
        ${imgTag}
        <div class="carte-meta">
          <span class="carte-relation-type">${r.relation_inverse || ""}</span>
          <span class="carte-titre">${oeuvre.titre}</span>
          <span class="carte-annee">${oeuvre.annee || ""}</span>
        </div>
      </a>`;
  }).join("");

  // ─── Rendu final ────────────────────────────────────────────────────────────
  conteneur.innerHTML = `
    <a href="index.html?vue=publications" class="retour">← Retour aux publications</a>
    <main class="fiche">
      <div class="images">${imagesHTML}</div>
      <div class="meta">
        <h1>${publication.titre}</h1>
        ${publication.cote ? `<p class="cote">${publication.cote}</p>` : ""}
        ${publication.type ? `<p class="type-oeuvre">${publication.type}</p>` : ""}
        ${publication.date ? `<p>${publication.date}</p>` : ""}
        ${publication.edition ? `<p>${publication.edition}</p>` : ""}
        ${publication.description ? `<p class="description">${publication.description}</p>` : ""}
        ${publication.url_externe
          ? `<p class="lien-externe"><a href="${publication.url_externe}" target="_blank" rel="noopener">Voir en ligne ↗</a></p>`
          : ""}
      </div>
    </main>
    <section class="relations">
      <h2>Œuvres publiées</h2>
      <div class="relations-liste">
        ${oeuvresHTML || '<p class="vide">Aucune œuvre liée.</p>'}
      </div>
    </section>
  `;
}