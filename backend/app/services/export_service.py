import io
import xml.etree.ElementTree as ET
from typing import List
from datetime import datetime
from docx import Document
from docx.shared import Pt


from ..models import Task


class ExportService:
    """Service for exporting tasks in various formats."""
    
    @staticmethod
    def export_to_markdown(tasks: List[Task]) -> str:
        """
        Export tasks to clean, professional Markdown format.
        Args:
            tasks: List of Task objects to export
        Returns:
            Well-formatted Markdown string
        """
        from datetime import datetime

        output = []

        output.append("# Programming Tasks Export\n")
        output.append(f"**Exported:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        output.append(f"**Total Tasks:** {len(tasks)}\n")
        output.append("---\n")

        for i, task in enumerate(tasks, 1):

            output.append(f"\n## {i}. {task.title}\n")

            output.append(f"**Language:** {task.language}")
            output.append(f"**Concept:** {task.concept}")
            output.append(f"**Difficulty:** {task.difficulty}")

            if hasattr(task, 'template_name') and task.template_name:
                output.append(f"**Template:** {task.template_name}")

            output.append("\n---\n")

            output.append("### Task Description\n")
            output.append(f"{task.description}\n")

            if task.examples and task.examples.strip():
                output.append("### Examples\n")
                output.append(f"{task.examples}\n")

            if task.solution:
                output.append("### Reference Solution\n")
                lang = task.language.lower() if task.language else "text"
                output.append(f"```{lang}\n{task.solution}\n```\n")

            if task.tests and task.tests.strip():
                output.append("### Tests\n")
                lang = task.language.lower() if task.language else "text"
                output.append(f"```{lang}\n{task.tests}\n```\n")

            if hasattr(task, 'is_validated') and task.is_validated:
                validation = task.validation_result or {}
                status = validation.get('status', 'unknown')

                status_icon = "✅" if status == 'passed' else "❌"
                status_text = "PASSED" if status == 'passed' else "FAILED"

                output.append("### Validation\n")
                output.append(
                    f"{status_icon} **{status_text}** ({status.upper()})\n"
                )

            output.append("---\n")

        return "\n".join(output)

    @staticmethod
    def export_to_pdf(tasks: List[Task]) -> bytes:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            PageBreak,
            Table,
            TableStyle
        )
        from reportlab.lib.enums import TA_CENTER
        from reportlab.lib.colors import HexColor
        from reportlab.lib import colors
        import io
        from datetime import datetime

        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.8 * inch,
            leftMargin=0.8 * inch,
            topMargin=0.8 * inch,
            bottomMargin=0.8 * inch
        )

        styles = getSampleStyleSheet()

        styles.add(ParagraphStyle(
            name="MainTitle",
            parent=styles["Title"],
            fontSize=28,
            leading=34,
            alignment=TA_CENTER,
            textColor=HexColor("#1a365d"),
            spaceAfter=20
        ))

        styles.add(ParagraphStyle(
            name="Subtitle",
            parent=styles["Normal"],
            fontSize=14,
            alignment=TA_CENTER,
            textColor=HexColor("#64748b"),
            spaceAfter=12
        ))

        styles.add(ParagraphStyle(
            name="TaskTitle",
            parent=styles["Heading1"],
            fontSize=18,
            leading=22,
            textColor=HexColor("#1e40af"),
            spaceAfter=12
        ))

        styles.add(ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading2"],
            fontSize=13,
            textColor=HexColor("#334155"),
            spaceBefore=10,
            spaceAfter=6
        ))

        story = []

        story.append(Spacer(1, 2 * inch))

        story.append(Paragraph(
            "Programming Tasks Export",
            styles["MainTitle"]
        ))

        story.append(Paragraph(
            "EduCode Platform",
            styles["Subtitle"]
        ))

        story.append(Spacer(1, 0.4 * inch))

        story.append(Paragraph(
            datetime.now().strftime("Generated on %d %B %Y at %H:%M"),
            styles["Subtitle"]
        ))

        story.append(Paragraph(
            f"Total Tasks: <b>{len(tasks)}</b>",
            styles["Subtitle"]
        ))

        story.append(Spacer(1, 0.8 * inch))

        line = Table(
            [[""]],
            colWidths=[5.8 * inch],
            rowHeights=[2]
        )

        line.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), HexColor('#1a365d'))
        ]))

        story.append(line)

        story.append(PageBreak())

        for i, task in enumerate(tasks, 1):

            story.append(
                Paragraph(
                    f"{i}. {task.title}",
                    styles["TaskTitle"]
                )
            )

            meta_data = [
                ["Language", task.language],
                ["Concept", task.concept],
                ["Difficulty", task.difficulty]
            ]

            if hasattr(task, "template_name") and task.template_name:
                meta_data.append([
                    "Template",
                    task.template_name
                ])

            meta_table = Table(
                meta_data,
                colWidths=[1.4 * inch, 4.4 * inch]
            )

            meta_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), HexColor('#f8fafc')),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))

            story.append(meta_table)
            story.append(Spacer(1, 10))

            story.append(
                Paragraph(
                    "Description",
                    styles["SectionTitle"]
                )
            )

            story.append(
                Paragraph(
                    task.description,
                    styles["BodyText"]
                )
            )

            if task.examples and task.examples.strip():

                story.append(
                    Paragraph(
                        "Examples",
                        styles["SectionTitle"]
                    )
                )

                examples_box = Table(
                    [[task.examples]],
                    colWidths=[5.8 * inch]
                )

                examples_box.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
                    ('BOX', (0, 0), (-1, -1), 1, HexColor('#d1d5db')),
                    ('FONTNAME', (0, 0), (-1, -1), 'Courier'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('PADDING', (0, 0), (-1, -1), 8),
                ]))

                story.append(examples_box)

            if task.solution:

                story.append(
                    Paragraph(
                        "Reference Solution",
                        styles["SectionTitle"]
                    )
                )

                solution_box = Table(
                    [[task.solution]],
                    colWidths=[5.8 * inch]
                )

                solution_box.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
                    ('BOX', (0, 0), (-1, -1), 1, HexColor('#94a3b8')),
                    ('FONTNAME', (0, 0), (-1, -1), 'Courier'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('PADDING', (0, 0), (-1, -1), 10),
                ]))

                story.append(solution_box)

            if task.tests and task.tests.strip():

                story.append(
                    Paragraph(
                        "Tests",
                        styles["SectionTitle"]
                    )
                )

                tests_box = Table(
                    [[task.tests]],
                    colWidths=[5.8 * inch]
                )

                tests_box.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
                    ('BOX', (0, 0), (-1, -1), 1, HexColor('#94a3b8')),
                    ('FONTNAME', (0, 0), (-1, -1), 'Courier'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('PADDING', (0, 0), (-1, -1), 10),
                ]))

                story.append(tests_box)

            if hasattr(task, "is_validated") and task.is_validated:

                validation = task.validation_result or {}
                status = validation.get("status", "unknown")

                status_text = (
                    "PASSED"
                    if status == "passed"
                    else "FAILED"
                )

                story.append(Spacer(1, 10))

                story.append(
                    Paragraph(
                        f"<b>Validation:</b> {status_text}",
                        styles["BodyText"]
                    )
                )

            if i < len(tasks):
                story.append(PageBreak())

        def add_page_number(canvas, doc):
            canvas.saveState()
            canvas.setFont("Helvetica", 9)

            page_num = canvas.getPageNumber()

            if page_num > 1:
                canvas.drawRightString(
                    7.3 * inch,
                    0.5 * inch,
                    f"{page_num}"
                )

            canvas.restoreState()

        doc.build(
            story,
            onFirstPage=add_page_number,
            onLaterPages=add_page_number
        )

        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes

    
    @staticmethod
    def export_to_moodle_xml(tasks: List[Task]) -> str:
        import xml.etree.ElementTree as ET
        from datetime import datetime
        from html import escape

        root = ET.Element("quiz")

        for task in tasks:
            question = ET.SubElement(root, "question", {"type": "essay"})

            name = ET.SubElement(question, "name")
            ET.SubElement(name, "text").text = task.title

            questiontext = ET.SubElement(
                question,
                "questiontext",
                {"format": "html"}
            )

            qtext = ET.SubElement(questiontext, "text")

            html_content = f"""
    <div>
    <h3>{escape(task.title)}</h3>

    <p>
    <strong>Language:</strong> {escape(task.language)}<br/>
    <strong>Concept:</strong> {escape(task.concept)}<br/>
    <strong>Difficulty:</strong> {escape(task.difficulty)}
    </p>

    <h4>Task Description</h4>
    <p>{escape(task.description)}</p>
    """

            if task.examples and task.examples.strip():
                html_content += f"""
    <h4>Examples</h4>
    <pre>{escape(task.examples)}</pre>
    """

            if task.solution:
                html_content += f"""
    <h4>Reference Solution</h4>
    <pre>{escape(task.solution)}</pre>
    """

            if task.tests and task.tests.strip():
                html_content += f"""
    <h4>Tests</h4>
    <pre>{escape(task.tests)}</pre>
    """

            html_content += "</div>"

            qtext.text = html_content

            ET.SubElement(question, "defaultgrade").text = "10"
            ET.SubElement(question, "penalty").text = "0"
            ET.SubElement(question, "hidden").text = "0"

            if task.solution:
                generalfeedback = ET.SubElement(
                    question,
                    "generalfeedback",
                    {"format": "html"}
                )

                fb_text = ET.SubElement(generalfeedback, "text")
                fb_text.text = f"""
    <h4>Reference Solution</h4>
    <pre>{escape(task.solution)}</pre>
    """

        xml_str = ET.tostring(
            root,
            encoding="unicode",
            method="xml"
        )

        header = f"""<?xml version="1.0" encoding="UTF-8"?>
    <!-- EduCode Moodle XML Export -->
    <!-- Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} -->
    <!-- Total Tasks: {len(tasks)} -->
    """

        return header + xml_str
    
    @staticmethod
    def get_export_filename(format: str, prefix: str = "edocode_tasks") -> str:
        """
        Generate professional filename for different export formats.
        """
        extensions = {
            "pdf": "pdf",
            "markdown": "md",
            "moodle_xml": "xml",
            "docx": "docx",
            "json": "json"
        }

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = extensions.get(format.lower(), "txt")
        
        return f"{prefix}_{timestamp}.{ext}"
    
    @staticmethod
    def export_to_docx(tasks: List[Task]) -> bytes:
        """
        Professional DOCX export with elegant title page and page numbering.
        """
        from docx import Document
        from docx.shared import Inches, Pt
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from docx.oxml.ns import qn
        import io
        from datetime import datetime

        document = Document()

        section = document.sections[0]
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

        section.different_first_page_header_footer = True

        for _ in range(5):
            document.add_paragraph()

        title = document.add_heading("Programming Tasks Export", 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title.runs[0]
        title_run.font.size = Pt(42)
        title_run.font.bold = True

        subtitle = document.add_paragraph("EduCode Platform", style='Subtitle')
        subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
        subtitle.runs[0].font.size = Pt(18)
        subtitle.runs[0].font.italic = True

        document.add_paragraph()

        info = document.add_paragraph()
        info.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = info.add_run(f"Exported: {datetime.now().strftime('%d %B %Y at %H:%M:%S')}\n")
        run.font.size = Pt(13)
        run.font.italic = True

        run = info.add_run(f"Total tasks: {len(tasks)}")
        run.font.size = Pt(13)

        document.add_paragraph("═" * 60).alignment = WD_ALIGN_PARAGRAPH.CENTER

        document.add_page_break()

        for i, task in enumerate(tasks, 1):
            document.add_heading(f"{i}. {task.title}", level=1)

            meta_p = document.add_paragraph()
            meta_p.add_run("Language: ").bold = True
            meta_p.add_run(f"{task.language}  ")
            meta_p.add_run("Concept: ").bold = True
            meta_p.add_run(f"{task.concept}  ")
            meta_p.add_run("Difficulty: ").bold = True
            meta_p.add_run(task.difficulty)

            if hasattr(task, 'template_name') and task.template_name:
                meta_p = document.add_paragraph()
                meta_p.add_run("Template: ").bold = True
                meta_p.add_run(task.template_name)

            document.add_paragraph()

            document.add_heading("Description", level=2)
            document.add_paragraph(task.description)

            if task.examples and task.examples.strip():
                document.add_heading("Examples", level=2)
                p = document.add_paragraph(task.examples)
                if len(task.examples) < 600:
                    p.style = 'Intense Quote'

            if task.solution:
                document.add_heading("Reference Solution", level=2)
                p = document.add_paragraph()
                run = p.add_run(task.solution)
                run.font.name = 'Consolas'
                run.font.size = Pt(9.5)

            if task.tests and task.tests.strip():
                document.add_heading("Tests", level=2)
                p = document.add_paragraph()
                run = p.add_run(task.tests)
                run.font.name = 'Consolas'
                run.font.size = Pt(9.5)

            if hasattr(task, 'is_validated') and task.is_validated:
                validation = task.validation_result or {}
                status = validation.get('status', 'unknown')
                status_text = "✅ PASSED" if status == 'passed' else "❌ FAILED"
                p = document.add_paragraph()
                p.add_run("Validation: ").bold = True
                p.add_run(status_text)

            if i < len(tasks):
                document.add_page_break()

        for section in document.sections:
            footer = section.footer
            for para in list(footer.paragraphs):
                para.clear()
            
            p = footer.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            
            p.add_run("").font.size = Pt(10)
            
            run = p.add_run()
            fld = run._element.makeelement(
                qn('w:fldSimple'), 
                attrib={qn('w:instr'): 'PAGE'}
            )
            run._element.append(fld)

        buffer = io.BytesIO()
        document.save(buffer)
        return buffer.getvalue()