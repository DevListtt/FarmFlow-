import unittest

from app.api import pilotage
from app.core.module_registry import load_manifest_catalog, validate_registry


class ModuleRegistryTest(unittest.TestCase):
    def test_manifest_catalog_is_versioned(self):
        catalog = load_manifest_catalog()

        self.assertEqual(catalog["manifest_version"], 1)
        self.assertEqual(catalog["source"], "catalog")
        self.assertIn("commandes-clients", catalog["modules"])

    def test_all_apps_are_enriched_from_catalog(self):
        self.assertGreaterEqual(len(pilotage.AGRI_APPS), 20)

        for app in pilotage.AGRI_APPS:
            self.assertEqual(app["manifest_source"], "catalog")
            self.assertEqual(app["manifest_version"], 1)
            self.assertIsInstance(app["dependances"], list)
            self.assertIsInstance(app["etats"], list)
            self.assertIsInstance(app["permissions"], list)
            self.assertIsInstance(app["contrats"], list)

    def test_registry_validation_is_clean(self):
        validation = validate_registry(
            pilotage.AGRI_APPS,
            pilotage.AGRI_WORKFLOWS,
            pilotage.AGRI_ROLES,
            pilotage.CATEGORY_LABELS,
        )

        self.assertEqual(validation["statut"], "ok")
        self.assertEqual(validation["erreurs"], [])
        self.assertEqual(validation["avertissements"], [])


if __name__ == "__main__":
    unittest.main()
