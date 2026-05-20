import io
import xml.etree.ElementTree as ET
from typing import List
from datetime import datetime

from ..models import Task


class ExportService:
    """Service for exporting tasks in various formats."""
    
    @staticmethod
    def export_to_markdown(tasks: List[Task]) -> str:
        """
        Export tasks to Markdown format.
        
        Args:
            tasks: List of Task objects to export
            
        Returns:
            Markdown string
        """
        output = []
        output.append("# Programming Tasks Export\n")
        output.append(f"Exported on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        output.append(f"Total tasks: {len(tasks)}\n")
        output.append("\n---\n")
        
        for i, task in enumerate(tasks, 1):
            output.append(f"\n## Task {i}: {task.title}\n")
            output.append(f"**Language:** {task.language}\n")
            output.append(f"**Concept:** {task.concept}\n")
            output.append(f"**Difficulty:** {task.difficulty}\n")
            if task.template_name:
                output.append(f"**Template:** {task.template_name}\n")
            
            output.append(f"\n### Description\n\n{task.description}\n")
            
            if task.examples:
                output.append(f"\n### Examples\n\n{task.examples}\n")
            
            if task.solution:
                output.append(f"\n### Reference Solution\n\n")
                output.append(f"```{task.language.lower()}\n{task.solution}\n```\n")
            
            if task.tests:
                output.append(f"\n### Tests\n\n")
                output.append(f"```{task.language.lower()}\n{task.tests}\n```\n")
            
            if task.is_validated:
                validation = task.validation_result or {}
                status = validation.get('status', 'unknown')
                output.append(f"\n### Validation Status: {'✅' if status == 'passed' else '❌'} {status.upper()}\n")
            
            output.append("\n---\n")
        
        return "\n".join(output)
    
    @staticmethod
    def export_to_pdf(tasks: List[Task]) -> bytes:
        """
        Export tasks to PDF format.
        
        Args:
            tasks: List of Task objects to export
            
        Returns:
            PDF bytes
        """
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
        from reportlab.lib.enums import TA_LEFT, TA_CENTER
        from reportlab.lib.colors import HexColor
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        # Container for the 'Flowable' objects
        story = []
        
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='CenterTitle', parent=styles['Heading1'], alignment=TA_CENTER))
        styles.add(ParagraphStyle(name='TaskTitle', parent=styles['Heading2'], spaceBefore=12, spaceAfter=6))
        styles.add(ParagraphStyle(name='MetaInfo', parent=styles['Normal'], fontSize=10, textColor=HexColor('#666666')))
        styles.add(ParagraphStyle(name='CodeBlock', parent=styles['Code'], fontSize=9, leftIndent=20, rightIndent=20))
        
        story.append(Paragraph("Programming Tasks Export", styles['CenterTitle']))
        story.append(Paragraph(f"Exported: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['MetaInfo']))
        story.append(Paragraph(f"Total Tasks: {len(tasks)}", styles['MetaInfo']))
        story.append(Spacer(1, 0.25*inch))
        
        for i, task in enumerate(tasks, 1):

            story.append(Paragraph(f"Task {i}: {task.title}", styles['TaskTitle']))
            
            meta = f"<b>Language:</b> {task.language} | <b>Concept:</b> {task.concept} | <b>Difficulty:</b> {task.difficulty}"
            if task.template_name:
                meta += f" | <b>Template:</b> {task.template_name}"
            story.append(Paragraph(meta, styles['MetaInfo']))
            
            story.append(Paragraph("<b>Description:</b>", styles['Normal']))
            story.append(Paragraph(task.description[:1000] + ("..." if len(task.description) > 1000 else ""), styles['Normal']))
            
            if task.examples:
                story.append(Paragraph("<b>Examples:</b>", styles['Normal']))
                story.append(Paragraph(task.examples[:500] + ("..." if len(task.examples) > 500 else ""), styles['Normal']))
            
            if task.solution:
                story.append(Paragraph("<b>Reference Solution:</b>", styles['Normal']))
                solution_text = task.solution[:1500] + ("..." if len(task.solution) > 1500 else "")
                story.append(Paragraph(solution_text, styles['CodeBlock']))
            
            if task.tests:
                story.append(Paragraph("<b>Tests:</b>", styles['Normal']))
                tests_text = task.tests[:1000] + ("..." if len(task.tests) > 1000 else "")
                story.append(Paragraph(tests_text, styles['CodeBlock']))
            
            if task.is_validated:
                validation = task.validation_result or {}
                status = validation.get('status', 'unknown')
                status_text = "✅ PASSED" if status == 'passed' else "❌ FAILED"
                story.append(Paragraph(f"<b>Validation:</b> {status_text}", styles['Normal']))
            
            story.append(Spacer(1, 0.2*inch))
            
            # Add page break after each task (except the last)
            if i < len(tasks):
                story.append(PageBreak())
        
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    @staticmethod
    def export_to_moodle_xml(tasks: List[Task]) -> str:
        """
        Export tasks to Moodle XML format for import into Moodle LMS.
        
        Args:
            tasks: List of Task objects to export
            
        Returns:
            Moodle XML string
        """
        root = ET.Element("quiz")
        
        for task in tasks:
            # Create question element
            question = ET.SubElement(root, "question", type="essay")
            
            name = ET.SubElement(question, "name")
            text = ET.SubElement(name, "text")
            text.text = task.title
            
            questiontext = ET.SubElement(question, "questiontext", format="html")
            qtext = ET.SubElement(questiontext, "text")
            
            html_content = f"""<div class="task-description">
                <h3>{task.title}</h3>
                <p><strong>Language:</strong> {task.language} | <strong>Concept:</strong> {task.concept} | <strong>Difficulty:</strong> {task.difficulty}</p>
                <h4>Task Description:</h4>
                <p>{task.description}</p>"""
            
            if task.examples:
                html_content += f"""<h4>Examples:</h4><pre>{task.examples}</pre>"""
            
            if task.solution:
                html_content += f"""<h4>Reference Solution:</h4><pre><code>{task.solution}</code></pre>"""
            
            html_content += "</div>"
            qtext.text = html_content
            
            defaultgrade = ET.SubElement(question, "defaultgrade")
            defaultgrade.text = "10"
            
            # Penalty factor
            penalty = ET.SubElement(question, "penalty")
            penalty.text = "0"
            
            hidden = ET.SubElement(question, "hidden")
            hidden.text = "0"
            
            if task.solution:
                generalfeedback = ET.SubElement(question, "generalfeedback")
                gfbtext = ET.SubElement(generalfeedback, "text")
                gfbtext.text = f"Reference Solution:\n\n{task.solution}"
        
        # Convert to string with proper encoding
        xml_str = ET.tostring(root, encoding='unicode', method='xml')
        
        xml_output = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml_output += '<!-- Moodle XML Export from EduCode -->\n'
        xml_output += f'<!-- Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} -->\n'
        xml_output += f'<!-- Total tasks: {len(tasks)} -->\n\n'
        xml_output += xml_str
        
        return xml_output
    
    @staticmethod
    def get_export_filename(format: str) -> str:
        """Get appropriate filename for export."""
        extensions = {
            "pdf": "pdf",
            "markdown": "md",
            "moodle_xml": "xml"
        }
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"edocode_tasks_{timestamp}.{extensions.get(format, 'txt')}"