"""
Génération d'étiquettes PDF
"""
from typing import List, Dict, Optional
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle, Paragraph, SimpleDocTemplate, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
from fastapi.responses import StreamingResponse
from ..database import SessionLocal
from .. import models


def generer_etiquette_animal(animal_id: int) -> bytes:
    """
    Générer une étiquette PDF pour un animal
    
    Args:
        animal_id: ID de l'animal
        
    Returns:
        bytes: PDF de l'étiquette
    """
    db = SessionLocal()
    try:
        animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
        
        if not animal:
            raise ValueError("Animal non trouvé")
        
        # Créer un buffer pour le PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=10*mm, leftMargin=10*mm, topMargin=10*mm, bottomMargin=10*mm)
        
        story = []
        styles = getSampleStyleSheet()
        
        # Style pour le titre
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.black,
            spaceAfter=20,
            alignment=TA_CENTER
        )
        
        # Style pour le texte
        text_style = ParagraphStyle(
            'CustomText',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=10,
            alignment=TA_LEFT
        )
        
        # Ajouter le titre
        story.append(Paragraph("ÉTIQUETTE ANIMAL", title_style))
        story.append(Spacer(1, 5*mm))
        
        # Ajouter les informations de l'animal
        story.append(Paragraph(f"<b>RFID:</b> {animal.rfid}", text_style))
        story.append(Paragraph(f"<b>Nom:</b> {animal.nom or 'N/A'}", text_style))
        story.append(Paragraph(f"<b>Type:</b> {animal.type_animal.nom if animal.type_animal else 'N/A'}", text_style))
        story.append(Paragraph(f"<b>Race:</b> {animal.race.nom if animal.race else 'N/A'}", text_style))
        story.append(Paragraph(f"<b>Sexe:</b> {animal.sexe}", text_style))
        story.append(Paragraph(f"<b>Date de naissance:</b> {animal.date_naissance}", text_style))
        story.append(Paragraph(f"<b>Poids:</b> {animal.poids} kg", text_style))
        story.append(Paragraph(f"<b>Statut:</b> {animal.statut}", text_style))
        
        # Ajouter un espace
        story.append(Spacer(1, 10*mm))
        
        # Ajouter un code-barres (simulé)
        story.append(Paragraph("[CODE-BARRES: " + animal.rfid + "]", text_style))
        
        # Générer le PDF
        doc.build(story)
        
        buffer.seek(0)
        return buffer.getvalue()
    finally:
        db.close()


def generer_etiquette_animal_stream(animal_id: int) -> StreamingResponse:
    """
    Générer une étiquette PDF pour un animal en tant que StreamingResponse
    
    Args:
        animal_id: ID de l'animal
        
    Returns:
        StreamingResponse: Réponse HTTP avec le PDF
    """
    pdf_data = generer_etiquette_animal(animal_id)
    return StreamingResponse(
        io.BytesIO(pdf_data),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=etiquette_animal.pdf"}
    )


def generer_etiquette_produit(produit_id: int) -> bytes:
    """
    Générer une étiquette PDF pour un produit
    
    Args:
        produit_id: ID du produit
        
    Returns:
        bytes: PDF de l'étiquette
    """
    db = SessionLocal()
    try:
        produit = db.query(models.Produit).filter(models.Produit.id == produit_id).first()
        
        if not produit:
            raise ValueError("Produit non trouvé")
        
        # Créer un buffer pour le PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=10*mm, leftMargin=10*mm, topMargin=10*mm, bottomMargin=10*mm)
        
        story = []
        styles = getSampleStyleSheet()
        
        # Style pour le titre
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.black,
            spaceAfter=20,
            alignment=TA_CENTER
        )
        
        # Style pour le texte
        text_style = ParagraphStyle(
            'CustomText',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=10,
            alignment=TA_LEFT
        )
        
        # Ajouter le titre
        story.append(Paragraph("ÉTIQUETTE PRODUIT", title_style))
        story.append(Spacer(1, 5*mm))
        
        # Ajouter les informations du produit
        story.append(Paragraph(f"<b>Code:</b> {produit.code}", text_style))
        story.append(Paragraph(f"<b>Nom:</b> {produit.nom}", text_style))
        story.append(Paragraph(f"<b>Type:</b> {produit.type_produit}", text_style))
        story.append(Paragraph(f"<b>Prix de vente:</b> {produit.prix_vente} €", text_style))
        story.append(Paragraph(f"<b>Unité:</b> {produit.unite}", text_style))
        story.append(Paragraph(f"<b>Description:</b> {produit.description or 'N/A'}", text_style))
        
        # Ajouter un espace
        story.append(Spacer(1, 10*mm))
        
        # Ajouter un code-barres (simulé)
        story.append(Paragraph("[CODE-BARRES: " + produit.code + "]", text_style))
        
        # Générer le PDF
        doc.build(story)
        
        buffer.seek(0)
        return buffer.getvalue()
    finally:
        db.close()


def generer_etiquette_produit_stream(produit_id: int) -> StreamingResponse:
    """
    Générer une étiquette PDF pour un produit en tant que StreamingResponse
    
    Args:
        produit_id: ID du produit
        
    Returns:
        StreamingResponse: Réponse HTTP avec le PDF
    """
    pdf_data = generer_etiquette_produit(produit_id)
    return StreamingResponse(
        io.BytesIO(pdf_data),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=etiquette_produit.pdf"}
    )


def generer_etiquettes_multiples(ids: List[int], type_etiquette: str = "animal") -> bytes:
    """
    Générer plusieurs étiquettes PDF
    
    Args:
        ids: Liste des IDs
        type_etiquette: Type d'étiquette (animal, produit)
        
    Returns:
        bytes: PDF avec toutes les étiquettes
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=10*mm, leftMargin=10*mm, topMargin=10*mm, bottomMargin=10*mm)
    
    story = []
    styles = getSampleStyleSheet()
    
    # Style pour le titre
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.black,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    # Style pour le texte
    text_style = ParagraphStyle(
        'CustomText',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=10,
        alignment=TA_LEFT
    )
    
    # Ajouter le titre
    story.append(Paragraph("ÉTIQUETTES", title_style))
    story.append(Spacer(1, 10*mm))
    
    # Générer chaque étiquette
    for id_ in ids:
        if type_etiquette == "animal":
            try:
                etiquette = generer_etiquette_animal(id_)
                # Pour l'instant, on ajoute juste le texte
                story.append(Paragraph(f"Étiquette animal: {id_}", text_style))
            except Exception as e:
                story.append(Paragraph(f"Erreur pour l'animal {id_}: {str(e)}", text_style))
        elif type_etiquette == "produit":
            try:
                etiquette = generer_etiquette_produit(id_)
                # Pour l'instant, on ajoute juste le texte
                story.append(Paragraph(f"Étiquette produit: {id_}", text_style))
            except Exception as e:
                story.append(Paragraph(f"Erreur pour le produit {id_}: {str(e)}", text_style))
        
        story.append(Spacer(1, 5*mm))
    
    # Générer le PDF
    doc.build(story)
    
    buffer.seek(0)
    return buffer.getvalue()


def generer_etiquettes_stream(ids: List[int], type_etiquette: str = "animal") -> StreamingResponse:
    """
    Générer plusieurs étiquettes PDF en tant que StreamingResponse
    
    Args:
        ids: Liste des IDs
        type_etiquette: Type d'étiquette (animal, produit)
        
    Returns:
        StreamingResponse: Réponse HTTP avec le PDF
    """
    pdf_data = generer_etiquettes_multiples(ids, type_etiquette)
    return StreamingResponse(
        io.BytesIO(pdf_data),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=etiquettes_{type_etiquette}.pdf"}
    )
