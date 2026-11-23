from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.models.schemas import MandiDocumentRequest
from app.services.pdf_generator import generate_pdf
from pydantic import BaseModel, Field
from typing import Optional
import base64
import tempfile
import os

router = APIRouter()


class PrintRequest(BaseModel):
    data: MandiDocumentRequest
    copies: int = Field(default=1, ge=1, le=100)
    printer_name: Optional[str] = None


@router.post("/pdf")
async def get_print_pdf(request: PrintRequest):
    try:
        pdf_bytes = generate_pdf(request.data)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=Mandi_Gate_Pass_{request.data.mandi_name.replace(' ', '_')}.pdf",
                "X-Copies": str(request.copies)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pdf-base64")
async def get_print_pdf_base64(request: PrintRequest):
    try:
        pdf_bytes = generate_pdf(request.data)
        return {
            "pdf_base64": base64.b64encode(pdf_bytes).decode('utf-8'),
            "copies": request.copies,
            "filename": f"Mandi_Gate_Pass_{request.data.mandi_name.replace(' ', '_')}.pdf"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/printers")
async def get_printers():
    printers = [
        {"name": "Default Printer", "is_default": True},
        {"name": "PDF Printer", "is_default": False},
    ]
    
    # Try to get actual printers on Windows
    try:
        import win32print
        printer_list = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)
        printers = []
        default_printer = win32print.GetDefaultPrinter()
        for printer_info in printer_list:
            name = printer_info[2]
            printers.append({
                "name": name,
                "is_default": name == default_printer
            })
    except ImportError:
        pass
    except Exception:
        pass
    
    return {
        "printers": printers,
        "note": "Printer detection requires backend running on the same machine as the printer. For web deployment, use browser print dialog."
    }


@router.post("/silent-print")
async def silent_print(request: PrintRequest):
    """
    Silent print directly to local printer (Windows only).
    Uses raw printing for reliability. Requires backend running on the same machine as the printer.
    """
    try:
        import win32print
        
        pdf_bytes = generate_pdf(request.data)
        
        # Determine printer to use
        printer_name = request.printer_name
        if not printer_name:
            printer_name = win32print.GetDefaultPrinter()
        
        # Open printer
        hprinter = win32print.OpenPrinter(printer_name)
        try:
            # Start document
            job_info = ("Mandi Gate Pass", None, "RAW")
            job_id = win32print.StartDocPrinter(hprinter, 1, job_info)
            
            for _ in range(request.copies):
                win32print.StartPagePrinter(hprinter)
                # Write PDF bytes as raw data
                win32print.WritePrinter(hprinter, pdf_bytes)
                win32print.EndPagePrinter(hprinter)
            
            win32print.EndDocPrinter(hprinter)
            
            return {
                "success": True,
                "message": f"Sent {request.copies} copy(ies) to printer '{printer_name}'",
                "printer": printer_name,
                "copies": request.copies
            }
        finally:
            win32print.ClosePrinter(hprinter)
            
    except ImportError:
        raise HTTPException(status_code=500, detail="win32print not available. Install pywin32.")
    except Exception as e:
        # Fallback to ShellExecute for printers that need it
        try:
            import win32api
            
            # Save PDF to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                tmp.write(pdf_bytes)
                tmp_path = tmp.name
            
            try:
                printer_name = request.printer_name or win32print.GetDefaultPrinter()
                
                for _ in range(request.copies):
                    win32api.ShellExecute(
                        0,
                        "print",
                        tmp_path,
                        f'/d:"{printer_name}"',
                        ".",
                        0
                    )
                
                return {
                    "success": True,
                    "message": f"Sent {request.copies} copy(ies) to printer '{printer_name}' (via ShellExecute)",
                    "printer": printer_name,
                    "copies": request.copies
                }
            except Exception as e2:
                raise HTTPException(status_code=500, detail=f"Both raw and ShellExecute failed: {str(e2)}")
            finally:
                # Cleanup temp file
                import threading
                def cleanup():
                    import time
                    time.sleep(5)
                    try:
                        os.unlink(tmp_path)
                    except:
                        pass
                threading.Thread(target=cleanup, daemon=True).start()
                
        except ImportError:
            raise HTTPException(status_code=500, detail="win32print/win32api not available. Install pywin32.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Silent print failed: {str(e)}")


@router.post("/silent-print-raw")
async def silent_print_raw(request: PrintRequest):
    """
    Raw printing using win32print directly (alias for silent-print).
    """
    return await silent_print(request)