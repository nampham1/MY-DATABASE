import sqlite3
import json
import os

# -------------------------
# OEUVRES
# -------------------------
def creer_json_oeuvres(cur):
    cur.execute("""
        SELECT o.*,
               t_type.libelle AS type_oeuvre,
               t_tech.libelle AS technique,
               t_tech.uri_getty AS technique_uri_getty,
               t_tech.uri_wikidata AS technique_uri_wikidata,
               t_sup.libelle AS support,
               t_sup.uri_getty AS support_uri_getty,
               t_sup.uri_wikidata AS support_uri_wikidata
        FROM oeuvre o
        LEFT JOIN terme t_type ON o.type_oeuvre_id=t_type.id
        LEFT JOIN terme t_tech ON o.technique_id=t_tech.id
        LEFT JOIN terme t_sup ON o.support_id=t_sup.id
        WHERE o.est_publique=1
        ORDER BY o.annee DESC,o.id DESC
    """)

    oeuvres = []

    for row in cur.fetchall():
        oeuvres.append({
            "id": row["id"],
            "cote": row["cote"],
            "titre": row["titre"],
            "annee": row["annee"],
            "largeur": row["largeur"],
            "hauteur": row["hauteur"],
            "duree": row["duree"],
            "description": row["description"],
            "localisation": row["localisation"],
            "url_externe": row["url_externe"],
            "notes_creation": row["notes_creation"],
            "created_at": row["created_at"],
            "type_oeuvre": row["type_oeuvre"],

            "technique": {
                "libelle": row["technique"],
                "uri_getty": row["technique_uri_getty"],
                "uri_wikidata": row["technique_uri_wikidata"]
            } if row["technique"] else None,

            "support": {
                "libelle": row["support"],
                "uri_getty": row["support_uri_getty"],
                "uri_wikidata": row["support_uri_wikidata"]
            } if row["support"] else None,
        })

    return oeuvres


# -------------------------
# IMAGES
# -------------------------
def creer_json_images(cur):
    cur.execute("""
        SELECT *
        FROM image
        ORDER BY oeuvre_id, ordre
    """)

    images = []

    for row in cur.fetchall():
        image = dict(row)
        image["img_temp"] = bool(image["img_temp"])
        images.append(image)

    return images

# -------------------------
# IMAGE PRINCIPALE
# -------------------------
def ajouter_image_principale(oeuvres, images):
    images_par_oeuvre = {}

    for img in images:
        images_par_oeuvre.setdefault(
            img["oeuvre_id"],
            img["chemin"]
        )

    for oeuvre in oeuvres:
        oeuvre["image_principale"] = images_par_oeuvre.get(
            oeuvre["id"]
        )
# -------------------------
# IMAGES EVENEMENTS
# -------------------------
def creer_json_images_evenements(cur):
    cur.execute("""
        SELECT *
        FROM image_evenement
        ORDER BY evenement_id, ordre
    """)

    return [
        dict(row)
        for row in cur.fetchall()
    ]

# -------------------------
# SERIES
# -------------------------
def creer_json_series(cur):
    cur.execute("""
        SELECT *
        FROM serie
        ORDER BY annee_debut, id
    """)

    return [
        dict(row)
        for row in cur.fetchall()
    ]
# -------------------------
# EVENEMENTS
# -------------------------
def creer_json_evenements(cur):
    cur.execute("""
        SELECT e.*, t.libelle AS type
        FROM evenement e
        LEFT JOIN terme t ON e.type_id = t.id
        ORDER BY e.date_debut DESC, e.id DESC
    """)

    evenements = []

    for row in cur.fetchall():
        evenement = dict(row)

        evenement["type"] = row["type"]

        evenements.append(evenement)

    return evenements

# -------------------------
# PUBLICATIONS
# -------------------------
def creer_json_publications(cur):
    cur.execute("""
        SELECT p.*, t.libelle AS type
        FROM publication p
        LEFT JOIN terme t ON p.type_id = t.id
        ORDER BY p.date DESC, p.id DESC
    """)

    publications = []

    for row in cur.fetchall():
        publication = dict(row)
        publication["type"] = row["type"]
        publications.append(publication)

    return publications

# -------------------------
# IMAGES PUBLICATIONS
# -------------------------
def creer_json_images_publications(cur):
    cur.execute("""
        SELECT *
        FROM image_publication
        ORDER BY publication_id, ordre
    """)

    return [
        dict(row)
        for row in cur.fetchall()
    ]

# -------------------------
# THEMES
# -------------------------
def creer_json_themes(cur):
    cur.execute("""
        SELECT *
        FROM theme
        ORDER BY categorie, libelle
    """)

    return [
        dict(row)
        for row in cur.fetchall()
    ]
# -------------------------
# TERMES
# -------------------------
def creer_json_termes(cur):
    cur.execute("""
        SELECT *
        FROM terme
        ORDER BY type, libelle
    """)

    return [
        dict(row)
        for row in cur.fetchall()
    ]
# -------------------------
# RELATIONS INVERSEES
# -------------------------

LIBELLES_INVERSES = {
    # oeuvre -> oeuvre
    "Basé sur": "a servi de base à",
    "Contient un élément de": "est repris dans",
    "Édité dans": "a publié",

    # oeuvre -> événement
    "Exposé à": "a exposé",
    "Présenté à": "a présenté",
}

#--------------------------
# RELATION OEUVRE_EVENEMENT
# -------------------------
def creer_json_oeuvre_evenements(cur):
    cur.execute("""
        SELECT oe.*,
               t.libelle
        FROM oeuvre_evenement oe
        JOIN terme t ON t.id = oe.type_relation_id
    """)

    resultat = []

    for row in cur.fetchall():

        relation = dict(row)

        relation["relation_directe"] = row["libelle"]
        relation["relation_inverse"] = LIBELLES_INVERSES.get(
            row["libelle"],
            row["libelle"]
        )

        resultat.append(relation)

    return resultat
# -------------------------
# RELATION OEUVRE_OEUVRE
# -------------------------
def creer_json_oeuvres_oeuvres(cur):
    cur.execute("""
        SELECT r.*,
               t.libelle,
               o_src.cote AS source_cote,
               o_src.titre AS source_titre,
               o_cib.cote AS cible_cote,
               o_cib.titre AS cible_titre
        FROM oeuvre_oeuvre r
        JOIN terme t ON t.id=r.type_relation_id
        JOIN oeuvre o_src ON o_src.id=r.oeuvre_source_id
        JOIN oeuvre o_cib ON o_cib.id=r.oeuvre_cible_id
        WHERE o_src.est_publique=1
          AND o_cib.est_publique=1
    """)

    resultat = []

    for row in cur.fetchall():
        relation = dict(row)

        relation["relation_directe"] = row["libelle"]
        relation["relation_inverse"] = LIBELLES_INVERSES.get(
            row["libelle"],
            row["libelle"]
        )

        resultat.append(relation)

    return resultat

# -------------------------
# RELATION OEUVRE_PUBLICATION
# -------------------------
def creer_json_oeuvre_publications(cur):
    cur.execute("""
        SELECT op.*,
               t.libelle
        FROM oeuvre_publication op
        JOIN terme t ON t.id = op.type_relation_id
    """)

    resultat = []

    for row in cur.fetchall():

        relation = dict(row)

        relation["relation_directe"] = row["libelle"]
        relation["relation_inverse"] = LIBELLES_INVERSES.get(
            row["libelle"],
            row["libelle"]
        )

        resultat.append(relation)

    return resultat

# -------------------------
# RELATION OEUVRE_SERIE
# -------------------------
def creer_json_oeuvre_series(cur):
    cur.execute("""
        SELECT *
        FROM oeuvre_serie
    """)

    return [
        dict(row)
        for row in cur.fetchall()
    ]

# -------------------------
# RELATION OEUVRE_THEME
# -------------------------
def creer_json_oeuvre_themes(cur):
    cur.execute("""
        SELECT *
        FROM oeuvre_theme
    """)

    return [
        dict(row)
        for row in cur.fetchall()
    ]

# -------------------------
# MAIN
# -------------------------
# 📁 chemins
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "..", "030_SQLite", "MyArtworks_V2.db")
OUTPUT_DIR = os.path.join(BASE_DIR, "site_public","data")

OEUVRES_FILE = os.path.join(OUTPUT_DIR, "oeuvres.json")
SERIES_FILE = os.path.join(OUTPUT_DIR, "series.json")
EVENEMENTS_FILE = os.path.join(OUTPUT_DIR, "evenements.json")
PUBLICATIONS_FILE = os.path.join(OUTPUT_DIR, "publications.json")

THEMES_FILE = os.path.join(OUTPUT_DIR, "themes.json")
TERMES_FILE = os.path.join(OUTPUT_DIR, "termes.json")

OEUVRE_THEMES_FILE = os.path.join(OUTPUT_DIR, "relation_oeuvre_themes.json")
OEUVRE_SERIES_FILE = os.path.join(OUTPUT_DIR, "relation_oeuvre_series.json")
OEUVRE_EVENTS_FILE = os.path.join(OUTPUT_DIR, "relation_oeuvre_evenements.json")
OEUVRE_PUBLICATIONS_FILE = os.path.join(OUTPUT_DIR, "relation_oeuvre_publications.json")
OEUVRES_OEUVRES_FILE = os.path.join(OUTPUT_DIR, "relation_oeuvres_oeuvres.json")

IMAGES_EVENEMENTS_FILE = os.path.join(OUTPUT_DIR, "images_evenements.json")
IMAGES_FILE = os.path.join(OUTPUT_DIR, "images.json")
IMAGES_PUBLICATIONS_FILE = os.path.join(OUTPUT_DIR, "images_publications.json")




def generer_json():
   

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    oeuvres = creer_json_oeuvres(cur)
    images = creer_json_images(cur)
    
    series = creer_json_series(cur)
    evenements = creer_json_evenements(cur)
    publications = creer_json_publications(cur)

    themes = creer_json_themes(cur)
    termes = creer_json_termes(cur)

    oeuvre_themes = creer_json_oeuvre_themes(cur)
    oeuvre_series = creer_json_oeuvre_series(cur)

    oeuvre_evenements = creer_json_oeuvre_evenements(cur)
    oeuvres_oeuvres = creer_json_oeuvres_oeuvres(cur)
    oeuvre_publications = creer_json_oeuvre_publications(cur)

    images_evenements = creer_json_images_evenements(cur)
    ajouter_image_principale(oeuvres, images)
    images_publications = creer_json_images_publications(cur)
    
    conn.close()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(OEUVRES_FILE, "w", encoding="utf-8") as f:
        json.dump(oeuvres, f, ensure_ascii=False, indent=2)

    with open(IMAGES_FILE, "w", encoding="utf-8") as f:
        json.dump(images, f, ensure_ascii=False, indent=2)

    with open(SERIES_FILE, "w", encoding="utf-8") as f:
        json.dump(series, f, ensure_ascii=False, indent=2)

    with open(EVENEMENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(evenements, f, ensure_ascii=False, indent=2)
    
    with open(PUBLICATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(publications, f, ensure_ascii=False, indent=2)


    with open(THEMES_FILE, "w", encoding="utf-8") as f:
        json.dump(themes, f, ensure_ascii=False, indent=2)

    with open(TERMES_FILE, "w", encoding="utf-8") as f:
        json.dump(termes, f, ensure_ascii=False, indent=2)


    with open(OEUVRE_THEMES_FILE, "w", encoding="utf-8") as f:
        json.dump(oeuvre_themes, f, ensure_ascii=False, indent=2)

    with open(OEUVRE_SERIES_FILE, "w", encoding="utf-8") as f:
        json.dump(oeuvre_series, f, ensure_ascii=False, indent=2)

    with open(OEUVRE_EVENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(oeuvre_evenements, f, ensure_ascii=False, indent=2)

    with open(OEUVRES_OEUVRES_FILE, "w", encoding="utf-8") as f:
        json.dump(oeuvres_oeuvres, f, ensure_ascii=False, indent=2)
    
    with open(OEUVRE_PUBLICATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(oeuvre_publications, f, ensure_ascii=False, indent=2)


    with open(IMAGES_EVENEMENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(images_evenements, f, ensure_ascii=False, indent=2)   

    with open(IMAGES_PUBLICATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(images_publications, f, ensure_ascii=False, indent=2)



    print(f"{len(oeuvres)} œuvres → {OEUVRES_FILE}")
    print(f"{len(images)} images → {IMAGES_FILE}")
    print(f"{len(series)} séries → {SERIES_FILE}")
    print(f"{len(evenements)} événements → {EVENEMENTS_FILE}")
    print(f"{len(publications)} publications → {PUBLICATIONS_FILE}")

    print(f"{len(themes)} thèmes → {THEMES_FILE}")
    
    print(f"{len(oeuvre_themes)} relations œuvre-themes")
    print(f"{len(oeuvre_series)} relations œuvre-série")
    print(f"{len(oeuvre_evenements)} relations œuvre-événement")
    print(f"{len(oeuvres_oeuvres)} relations œuvre-œuvre → {OEUVRES_OEUVRES_FILE}")
    print(f"{len(oeuvre_publications)} relations œuvre-publication")


    print(f"{len(images_evenements)} images d'événements → {IMAGES_EVENEMENTS_FILE}")
    print(f"{len(images_publications)} images de publications → {IMAGES_PUBLICATIONS_FILE}")

if __name__ == "__main__":
    generer_json()