/**
 * serie.js
 * Deux vues : index des séries + page d'une série.
 * Appelées par router.js.
 */

function afficherIndexSeries(app) {
  const conteneur = document.getElementById("app");

  // Ne lister que les séries ayant au moins une œuvre publique
  const seriesAvecOeuvres = app.series.filter(s =>
    app.oeuvre_series.some(r => r.serie_id === s.id)
  );

  const cartes = seriesAvecOeuvres.map(s => {
    const oeuvreIds = app.oeuvre_series
      .filter(r => r.serie_id === s.id)
      .map(r => r.oeuvre_id);
    const premiereOeuvre = app.oeuvres.find(o => oeuvreIds.includes(o.id));
    const img = premiereOeuvre?.image_principale
      ? `<img src="images/${premiereOeuvre.image_principale}" alt="${s.titre}">`
      : "";
    const nb = oeuvreIds.length;
    return `
      <a class="carte" href="index.html?vue=serie&id=${s.id}">
        ${img}
        <div class="carte-meta">
          <span class="carte-titre">${s.titre}</span>
          <span class="carte-annee">${nb} œuvre${nb > 1 ? "s" : ""}</span>
        </div>
      </a>`;
  }).join("");

  conteneur.innerHTML = `
    <a href="index.html" class="retour">← Retour à la galerie</a>
    <header class="page-header">
      <h1>Séries</h1>
    </header>
    <div class="galerie">${cartes || '<p class="vide">Aucune série.</p>'}</div>
  `;
}

function afficherSerie(id, app) {
  const conteneur = document.getElementById("app");

  const serie = app.series.find(s => s.id === id);
  if (!serie) {
    conteneur.innerHTML = "<p class='vide'>Série introuvable.</p>";
    return;
  }

  const oeuvreIds = app.oeuvre_series
    .filter(r => r.serie_id === id)
    .map(r => r.oeuvre_id);
  const oeuvres = app.oeuvres.filter(o => oeuvreIds.includes(o.id));

  let periode = "";
  if (serie.annee_debut && serie.annee_fin) periode = `${serie.annee_debut} – ${serie.annee_fin}`;
  else if (serie.annee_debut) periode = `depuis ${serie.annee_debut}`;

  const cartes = oeuvres.map(o => {
    const img = o.image_principale
      ? `<img src="images/${o.image_principale}" alt="${o.titre}">`
      : "";
    return `
      <a class="carte" href="index.html?vue=oeuvre&id=${o.id}">
        ${img}
        <div class="carte-meta">
          <span class="carte-titre">${o.titre}</span>
          <span class="carte-annee">${o.annee || ""}</span>
        </div>
      </a>`;
  }).join("");

  conteneur.innerHTML = `
    <a href="index.html?vue=series" class="retour">← Retour aux séries</a>
    <header class="page-header">
      <h1>${serie.titre}</h1>
      ${periode ? `<p>${periode}</p>` : ""}
      ${serie.description ? `<p class="description">${serie.description}</p>` : ""}
    </header>
    <div class="galerie">${cartes || '<p class="vide">Aucune œuvre dans cette série.</p>'}</div>
  `;
}
