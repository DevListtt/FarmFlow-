"""
Génération de codes-barres
"""
import barcode
from barcode.writer import ImageWriter
import io
from fastapi.responses import StreamingResponse
from typing import Optional


def generer_code_barres(
    data: str,
    type_code: str = "code128",
    width: int = 200,
    height: int = 100,
    format: str = "PNG"
) -> bytes:
    """
    Générer un code-barres
    
    Args:
        data: Données à encoder
        type_code: Type de code-barres (code128, code39, ean, upc, etc.)
        width: Largeur de l'image
        height: Hauteur de l'image
        format: Format de l'image (PNG, JPEG, etc.)
        
    Returns:
        bytes: Image du code-barres
    """
    try:
        # Créer le code-barres
        code_class = getattr(barcode, type_code.upper(), barcode.get_barcode_class('code128'))
        code = code_class(data, writer=ImageWriter())
        
        # Générer l'image
        buffer = io.BytesIO()
        code.write(buffer, options={
            'module_width': 0.5,
            'module_height': 10,
            'font_size': 10,
            'text_distance': 5,
            'background': 'white',
            'foreground': 'black'
        })
        
        return buffer.getvalue()
    except Exception as e:
        raise ValueError(f"Erreur lors de la génération du code-barres: {str(e)}")


def generer_code_barres_stream(
    data: str,
    type_code: str = "code128",
    width: int = 200,
    height: int = 100
) -> StreamingResponse:
    """
    Générer un code-barres en tant que StreamingResponse
    
    Args:
        data: Données à encoder
        type_code: Type de code-barres
        width: Largeur de l'image
        height: Hauteur de l'image
        
    Returns:
        StreamingResponse: Réponse HTTP avec l'image
    """
    try:
        image_data = generer_code_barres(data, type_code, width, height)
        return StreamingResponse(
            io.BytesIO(image_data),
            media_type="image/png"
        )
    except Exception as e:
        raise ValueError(f"Erreur lors de la génération du code-barres: {str(e)}")


def valider_code_barres(code: str, type_code: str = "code128") -> bool:
    """
    Valider un code-barres
    
    Args:
        code: Code à valider
        type_code: Type de code-barres
        
    Returns:
        bool: True si le code est valide
    """
    try:
        code_class = getattr(barcode, type_code.upper(), barcode.get_barcode_class('code128'))
        code = code_class(code)
        return True
    except Exception:
        return False


def get_code_barres_types() -> list:
    """
    Obtenir la liste des types de codes-barres supportés
    
    Returns:
        list: Liste des types de codes-barres
    """
    return [
        "code128",
        "code39",
        "ean",
        "ean13",
        "ean8",
        "upc",
        "upca",
        "isbn",
        "issn",
        "itf",
        "jan",
        "gs1",
        "code93",
        "codabar",
        "pzs"
    ]
