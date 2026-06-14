import unittest
from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.transactionnel import (
    AuditFluxAgri,
    EcritureAutoAgri,
    MouvementStockAgri,
    OperationBancaireAgri,
    ProduitAgri,
    TicketCaisseAgri,
)
from app.services import transactionnel as tx
from app.api import commandes, comptabilite, noyau_agri, pilotage, pilotage_transactionnel


class TransactionalFlowTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_stock_movement_updates_stock_and_accounting(self):
        tx.seed_demo(self.db)
        product = self.db.query(ProduitAgri).filter(ProduitAgri.code == "panier-legumes").first()
        initial_stock = product.stock

        result = noyau_agri.creer_mouvement_stock(
            noyau_agri.MouvementStockRequest(
                produit="panier-legumes",
                sens="sortie",
                quantite=2,
                unite="piece",
                lot=product.lot_courant,
                origine="test inventaire",
                atelier="Boutique",
                cout_unitaire=product.cout_revient,
            ),
            db=self.db,
        )

        self.db.refresh(product)
        self.assertEqual(round(product.stock, 3), round(initial_stock - 2, 3))
        self.assertEqual(result["quantite"], -2)
        self.assertEqual(len(result["ecritures"]), 1)
        self.assertEqual(self.db.query(MouvementStockAgri).count(), 1)
        self.assertGreaterEqual(self.db.query(AuditFluxAgri).count(), 2)

    def test_cash_ticket_creates_stock_exit_and_balanced_entries(self):
        tx.seed_demo(self.db)
        product = self.db.query(ProduitAgri).filter(ProduitAgri.code == "oeufs-x12").first()
        initial_stock = product.stock

        result = pilotage_transactionnel.creer_ticket_caisse(
            pilotage_transactionnel.TicketCaisseRequest(
                client="Client test",
                moyen_paiement="card",
                remise_percent=0,
                lignes=[
                    pilotage_transactionnel.LigneTicketCaisse(
                        code="oeufs-x12",
                        nom="Oeufs plein air x12",
                        quantite=3,
                        prix_unitaire=product.prix_vente,
                        tva=product.tva,
                    )
                ],
            ),
            db=self.db,
        )

        self.db.refresh(product)
        entries = self.db.query(EcritureAutoAgri).filter(EcritureAutoAgri.document_reference == result["ticket_id"]).all()
        debit = round(sum(entry.debit or 0 for entry in entries), 2)
        credit = round(sum(entry.credit or 0 for entry in entries), 2)

        self.assertEqual(round(product.stock, 3), round(initial_stock - 3, 3))
        self.assertEqual(result["statut"], "valide")
        self.assertEqual(len(result["mouvements_stock"]), 1)
        self.assertEqual(len(entries), 5)
        self.assertEqual(debit, credit)
        self.assertEqual(self.db.query(TicketCaisseAgri).count(), 1)

    def test_customer_order_reserves_then_converts_to_ticket(self):
        tx.seed_demo(self.db)
        product = self.db.query(ProduitAgri).filter(ProduitAgri.code == "farine-1kg").first()
        initial_stock = product.stock

        created = commandes.creer_commande_client(
            commandes.CommandeClientRequest(
                client_nom="Restaurant test",
                segment="pro",
                canal="restaurant",
                mode_retrait="tournee-pro",
                remise_percent=5,
                lignes=[commandes.LigneCommandeRequest(code="farine-1kg", quantite=4)],
            ),
            db=self.db,
        )
        self.db.refresh(product)
        self.assertEqual(round(product.stock, 3), round(initial_stock, 3))
        self.assertEqual(created["commande"]["lignes"][0]["quantite_reservee"], 4)

        converted = commandes.convertir_commande_en_ticket(
            created["commande"]["reference"],
            commandes.ConversionCommandeRequest(moyen_paiement="transfer"),
            db=self.db,
        )

        self.db.refresh(product)
        entries = self.db.query(EcritureAutoAgri).filter(EcritureAutoAgri.document_reference == converted["ticket"]["reference"]).all()
        debit = round(sum(entry.debit or 0 for entry in entries), 2)
        credit = round(sum(entry.credit or 0 for entry in entries), 2)

        self.assertEqual(converted["statut"], "commande convertie")
        self.assertEqual(round(product.stock, 3), round(initial_stock - 4, 3))
        self.assertEqual(converted["commande"]["statut"], "convertie_caisse")
        self.assertEqual(converted["commande"]["lignes"][0]["quantite_reservee"], 0)
        self.assertEqual(len(converted["mouvements_stock"]), 1)
        self.assertEqual(len(entries), 5)
        self.assertEqual(debit, credit)

    def test_bank_reconciliation_updates_operation(self):
        operation = OperationBancaireAgri(
            reference="BQ-TEST-001",
            date_operation=date(2026, 6, 12),
            libelle="Versement TPE test",
            montant=48.5,
            statut="a_rapprocher",
            score=50,
        )
        self.db.add(operation)
        self.db.commit()

        result = comptabilite.rapprocher_operation(
            comptabilite.RapprochementRequest(
                operation_reference="BQ-TEST-001",
                document_reference="CAI-TEST-001",
                categorie="vente",
            ),
            db=self.db,
        )

        self.db.refresh(operation)
        self.assertEqual(result["statut"], "operation rapprochee")
        self.assertEqual(operation.statut, "rapprochee")
        self.assertEqual(operation.document_reference, "CAI-TEST-001")
        self.assertEqual(operation.score, 95)
        self.assertEqual(self.db.query(AuditFluxAgri).filter(AuditFluxAgri.flux == "banque").count(), 1)

    def test_cockpit_uses_transactional_data_when_available(self):
        tx.seed_demo(self.db)
        product = self.db.query(ProduitAgri).filter(ProduitAgri.code == "panier-legumes").first()
        ticket = pilotage_transactionnel.creer_ticket_caisse(
            pilotage_transactionnel.TicketCaisseRequest(
                client="Client cockpit",
                moyen_paiement="card",
                lignes=[
                    pilotage_transactionnel.LigneTicketCaisse(
                        code="panier-legumes",
                        nom="Panier legumes",
                        quantite=2,
                        prix_unitaire=product.prix_vente,
                        tva=product.tva,
                    )
                ],
            ),
            db=self.db,
        )
        self.db.add(
            OperationBancaireAgri(
                reference="BQ-COCKPIT-001",
                date_operation=date(2026, 6, 13),
                libelle="Versement TPE cockpit",
                montant=ticket["totaux"]["total"],
                statut="a_rapprocher",
                score=65,
            )
        )
        self.db.commit()

        cockpit = pilotage.get_cockpit(db=self.db)
        kpis = {item["code"]: item for item in cockpit["kpis"]}

        self.assertEqual(cockpit["source"], "transactions")
        self.assertGreater(kpis["ca"]["value"], 0)
        self.assertGreater(kpis["marge"]["value"], 0)
        self.assertGreater(len(cockpit["series"]["revenu_marge"]), 0)
        self.assertTrue(any(item["canal"] == "circuit-court" for item in cockpit["series"]["ventes_canaux"]))
        self.assertTrue(any("Rapprocher" in item["titre"] for item in cockpit["decisions"]))

    def test_cockpit_configuration_updates_targets_and_visible_kpis(self):
        pilotage.configurer_cockpit(
            pilotage.CockpitConfigurationRequest(
                objectifs={"ca": 999999, "ca_mensuel": 83333},
                regles={"displayed_kpis": ["ca", "marge"]},
            )
        )

        cockpit = pilotage.get_cockpit(db=self.db)
        kpis = {item["code"]: item for item in cockpit["kpis"]}

        self.assertEqual(set(kpis.keys()), {"ca", "marge"})
        self.assertEqual(kpis["ca"]["target"], 999999)
        self.assertEqual(cockpit["series"]["revenu_marge"][0]["objectif"], 83333)
        self.assertIn("configuration", cockpit)


if __name__ == "__main__":
    unittest.main()
