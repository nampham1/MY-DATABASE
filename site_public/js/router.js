/**
 * router.js
 * Chef d'orchestre de la SPA.
 *
 * URLs gérées :
 *   index.html                      → galerie principale
 *   index.html?vue=oeuvre&id=1      → fiche d'une œuvre
 *   index.html?vue=series           → index des séries
 *   index.html?vue=serie&id=1       → page d'une série
 *   index.html?vue=evenements       → index des événements
 *   index.html?vue=evenement&id=1   → page d'un événement
 *   index.html?vue=publications     → index des publications
 *   index.html?vue=publication&id=1 → page d'une publication
 */

// ─── État global ──────────────────────────────────────────────────────────────
const APP = {
  oeuvres: [],
  images: [],

  series: [],
  evenements: [],
  publications: [],

  themes: [],
  termes: [],

  oeuvre_themes: [],
  oeuvre_techniques: [],
  oeuvre_series: [],
  oeuvre_evenements: [],
  oeuvre_publications: [],

  relations_oeuvres: [],

  images_evenements: [],
  images_publications: [],

  chargé: false
};

// ─── Chargement des données ───────────────────────────────────────────────────
async function chargerDonnees() {
  if (APP.chargé) return;

  const [
    oeuvres,
    images,
    series,
    evenements,
    publications,
    themes,
    termes,
    oeuvre_themes,
    oeuvre_techniques,
    oeuvre_series,
    oeuvre_evenements,
    oeuvre_publications,
    relations_oeuvres,
    images_evenements,
    images_publications
  ] = await Promise.all([
    fetch("data/oeuvres.json").then(r => r.json()),
    fetch("data/images.json").then(r => r.json()),
    fetch("data/series.json").then(r => r.json()),
    fetch("data/evenements.json").then(r => r.json()),
    fetch("data/publications.json").then(r => r.json()),
    fetch("data/themes.json").then(r => r.json()),
    fetch("data/termes.json").then(r => r.json()),
    fetch("data/relation_oeuvre_themes.json").then(r => r.json()),
    fetch("data/relation_oeuvre_techniques.json").then(r => r.json()),
    fetch("data/relation_oeuvre_series.json").then(r => r.json()),
    fetch("data/relation_oeuvre_evenements.json").then(r => r.json()),
    fetch("data/relation_oeuvre_publications.json").then(r => r.json()),
    fetch("data/relation_oeuvres_oeuvres.json").then(r => r.json()),
    fetch("data/images_evenements.json").then(r => r.json()),
    fetch("data/images_publications.json").then(r => r.json())
  ]);

  APP.oeuvres = oeuvres;
  APP.images = images;
  APP.series = series;
  APP.evenements = evenements;
  APP.publications = publications;
  APP.themes = themes;
  APP.oeuvre_techniques = oeuvre_techniques;
  APP.termes = termes;
  APP.oeuvre_themes = oeuvre_themes;
  APP.oeuvre_series = oeuvre_series;
  APP.oeuvre_evenements = oeuvre_evenements;
  APP.oeuvre_publications = oeuvre_publications;
  APP.relations_oeuvres = relations_oeuvres;
  APP.images_evenements = images_evenements;
  APP.images_publications = images_publications;
  APP.chargé = true;
} // ← fin de chargerDonnees()

// ─── Routeur principal ────────────────────────────────────────────────────────
async function router() {
  await chargerDonnees();

  const params = new URLSearchParams(window.location.search);
  const vue = params.get("vue");
  const id = params.get("id") ? parseInt(params.get("id")) : null;

  const recherche = document.getElementById("recherche");
  recherche.style.display = vue ? "none" : "block";

  switch (vue) {
    case "oeuvre":
      afficherFiche(id, APP);
      break;
    case "serie":
      afficherSerie(id, APP);
      break;
    case "series":
      afficherIndexSeries(APP);
      break;
    case "evenement":
      afficherEvenement(id, APP);
      break;
    case "evenements":
      afficherIndexEvenements(APP);
      break;
    case "publication":
      afficherPublication(id, APP);
      break;
    case "publications":
      afficherIndexPublications(APP);
      break;
    default:
      afficherGalerie(APP);
      break;
  }
} // ← fin de router()

// ─── Navigation sans rechargement ────────────────────────────────────────────
document.addEventListener("click", (e) => {
  const lien = e.target.closest("a[href]");
  if (!lien) return;

  const href = lien.getAttribute("href");
  if (href.startsWith("http") || href.startsWith("mailto")) return;

  e.preventDefault();
  history.pushState({}, "", href);
  router();
});

window.addEventListener("popstate", router);

// ─── Point d'entrée ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", router);