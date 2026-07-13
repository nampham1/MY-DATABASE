/**
 * evenement.js
 * Deux vues : index des événements + page d'un événement.
 * Appelées par router.js.
 */

function afficherIndexEvenements(app) {
  const conteneur = document.getElementById("app");

  // Ne lister que les événements ayant au moins une œuvre publique liée
  const evtsAvecOeuvres = app.evenements.filter(e =>
    app.oeuvre_evenements.some(r => r.evenement_id === e.id)
  );

  const cartes = evtsAvecOeuvres.map(e => {
    const img = app.images_evenements.find(i => i.evenement_id === e.id);
    const imgHTML = img
      ? `<img src="images/${img.chemin}" alt="${e.titre}">`
      : "";
    const nb = app.oeuvre_evenements.filter(r => r.evenement_id === e.id).length;
    return `
      <a class="carte" href="index.html?vue=evenement&id=${e.id}">
        ${imgHTML}
        <div class="carte-meta">
          <span class="carte-titre">${e.titre}</span>
          <span class="carte-annee">${e.date_debut || ""}</span>
        </div>
      </a>`;
  }).join("");

  conteneur.innerHTML = `
    <a href="index.html" class="retour">← Retour à la galerie</a>
    <header class="page-header">
      <h1>Événements</h1>
      <p>Expositions, marchés, présentations publiques</p>
    </header>
    <div class="galerie">${cartes || '<p class="vide">Aucun événement.</p>'}</div>
  `;
}

function afficherEvenement(id, app) {
  const conteneur = document.getElementById("app");

  const evt = app.evenements.find(e => e.id === id);
  if (!evt) {
    conteneur.innerHTML = "<p class='vide'>Événement introuvable.</p>";
    return;
  }

  // Images de l'événement
  const imagesEvt = app.images_evenements.filter(i => i.evenement_id === id);
  const imagesHTML = imagesEvt.map(img => `
    <figure>
      <img src="images/${img.chemin}" alt="${evt.titre}">
      ${img.legende ? `<figcaption>${img.legende}</figcaption>` : ""}
    </figure>`).join("");

  // Période
  let periode = "";
  if (evt.date_debut && evt.date_fin && evt.date_debut !== evt.date_fin) {
    periode = `Du ${evt.date_debut} au ${evt.date_fin}`;
  } else if (evt.date_debut) {
    periode = evt.date_debut;
  }

  // Œuvres liées
  const oeuvreRels = app.oeuvre_evenements.filter(r => r.evenement_id === id);
  const oeuvresHTML = oeuvreRels.map(r => {
    const oeuvre = app.oeuvres.find(o => o.id === r.oeuvre_id);
    const typeRel = app.termes.find(t => t.id === r.type_relation_id);
    if (!oeuvre) return "";
    const img = oeuvre.image_principale
      ? `<img src="images/${oeuvre.image_principale}" alt="${oeuvre.titre}">`
      : "";
    return `
      <a class="carte carte-relation" href="index.html?vue=oeuvre&id=${oeuvre.id}">
        ${img}
        <div class="carte-meta">
          <span class="carte-relation-type">${typeRel?.libelle || ""}</span>
          <span class="carte-titre">${oeuvre.titre}</span>
          <span class="carte-annee">${oeuvre.annee || ""}</span>
        </div>
      </a>`;
  }).join("");

  conteneur.innerHTML = `
    <a href="index.html?vue=evenements" class="retour">← Retour aux événements</a>
    <main class="fiche">
      <div class="images">${imagesHTML}</div>
      <div class="meta">
        <h1>${evt.titre}</h1>
        ${evt.type ? `<p class="type-oeuvre">${evt.type}</p>` : ""}
        ${periode ? `<p>${periode}</p>` : ""}
        ${evt.lieu ? `<p class="localisation">${evt.lieu}</p>` : ""}
        ${evt.description ? `<p class="description">${evt.description}</p>` : ""}
        ${evt.url_externe ? `<p class="lien-externe"><a href="${evt.url_externe}" target="_blank" rel="noopener">Voir en ligne ↗</a></p>` : ""}
      </div>
    </main>
    <section class="relations">
      <h2>Œuvres présentées</h2>
      <div class="relations-liste">${oeuvresHTML || '<p class="vide">Aucune œuvre liée.</p>'}</div>
    </section>
  `;
}
