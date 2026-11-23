from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from app.models.schemas import MandiDocumentRequest
from datetime import datetime
from io import BytesIO


def generate_pdf(data: MandiDocumentRequest) -> bytes:
    buffer = BytesIO()
    
    # Page dimensions
    page_width, page_height = A4
    
    # Create canvas directly for precise control
    c = canvas.Canvas(buffer, pagesize=A4)
    
    # Margins from sample PDF
    left_margin = 34  # points (~12mm)
    top_margin = 43   # points (~15mm)
    
    # Grid dimensions from sample
    cell_width = 195  # points (~69mm) - distance between columns
    cell_height = 107 # points (~38mm) - distance between rows
    
    # Column X positions (3 columns)
    col_x = [left_margin, left_margin + cell_width, left_margin + 2 * cell_width]
    
    # Row Y positions (7 rows) - from top
    row_y = [top_margin + i * cell_height for i in range(7)]
    
    # Font settings
    font_name = 'Helvetica'  # Calibri not available, use Helvetica
    font_size = 9
    line_height = 11
    
    # Text content for each cell (7 lines) - use firm_name instead of fixed_line
    cell_lines = [
        f'MANDI NAME - {data.mandi_name}',
        f'VARIETY - {data.variety}',
        f'FRTC-{data.frtc_number}',
        f'VILLAGE - {data.village}',
        f'NO. of BAGES - {data.no_of_bages}bag',
        data.firm_name,
        f'{data.tag_color.value} tag'
    ]
    
    # Draw grid of 21 cells (7 rows x 3 columns)
    for row_idx in range(7):
        for col_idx in range(3):
            x = col_x[col_idx]
            y_start = page_height - row_y[row_idx]  # Convert from top to bottom coordinate
            
            # Draw cell border (optional - sample seems to have no borders)
            # c.rect(x, y_start - cell_height, cell_width, cell_height)
            
            # Draw 7 lines of text in this cell
            for line_idx, line_text in enumerate(cell_lines):
                y = y_start - (line_idx + 1) * line_height
                c.setFont(font_name, font_size)
                c.setFillColor(HexColor('#000000'))
                c.drawString(x, y, line_text)
    
    c.save()
    buffer.seek(0)
    return buffer.read()


def save_pdf(data: MandiDocumentRequest, filepath: str) -> None:
    pdf_bytes = generate_pdf(data)
    with open(filepath, 'wb') as f:
        f.write(pdf_bytes)