from fpdf import FPDF
import datetime

class ProjectPDF(FPDF):
    def header(self):
        # Draw a border for the header
        self.set_draw_color(79, 70, 229) # Indigo color
        self.set_line_width(0.5)
        self.line(10, 25, 200, 25)
        
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(79, 70, 229)
        self.cell(0, 10, 'ORION-X: AI-POWERED LEARNING ECOSYSTEM', 0, 0, 'R')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        date_str = datetime.datetime.now().strftime("%Y-%m-%d")
        self.cell(0, 10, f'Generated on {date_str} | Page {self.page_no()} / {{nb}}', 0, 0, 'C')

def generate_documentation():
    # Using fpdf2 features (unit='mm', format='A4')
    pdf = ProjectPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # --- Title Page ---
    pdf.ln(40)
    pdf.set_font('helvetica', 'B', 32)
    pdf.set_text_color(17, 24, 39) # Dark gray
    pdf.cell(0, 20, 'ORION-X', ln=True, align='C')
    
    pdf.set_font('helvetica', 'B', 18)
    pdf.set_text_color(79, 70, 229) # Indigo
    pdf.cell(0, 10, 'Revolutionizing Education through Generative AI', ln=True, align='C')
    
    pdf.ln(10)
    pdf.set_font('helvetica', '', 12)
    pdf.set_text_color(75, 85, 99) # Medium gray
    pdf.multi_cell(0, 10, "A comprehensive overview of the design, implementation, \nand mission of the Orion-X ecosystem.", align='C')
    
    pdf.ln(50)
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 10, 'Prepared for: Project Showcase 2026', ln=True, align='C')
    
    # --- Main Content ---
    pdf.add_page()
    
    # 1. WHY
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(79, 70, 229)
    pdf.cell(0, 10, '1. WHY: The Motivation', ln=True)
    pdf.set_font('helvetica', '', 12)
    pdf.set_text_color(31, 41, 55)
    why_text = (
        "Traditional Learning Management Systems (LMS) often function as mere storage containers for files. "
        "This leads to several critical issues:\n\n"
        "- Static Content: PDFs and slides lack interactivity, making self-study a passive and often disengaging experience.\n"
        "- The 'Engagement Gap': Students often feel overwhelmed by large volumes of technical data without immediate guidance.\n"
        "- Teacher Burnout: Educators spend a disproportionate amount of time on administrative tasks, such as creating quizzes and manual grading.\n\n"
        "Orion-X was developed to resolve these bottlenecks. By placing Generative AI at the core of the experience, "
        "we transform static documents into dynamic, conversational, and adaptive learning environments."
    )
    pdf.multi_cell(0, 7, why_text)
    pdf.ln(5)

    # 2. HOW
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(79, 70, 229)
    pdf.cell(0, 10, '2. HOW: Engineering & Architecture', ln=True)
    pdf.set_font('helvetica', '', 12)
    pdf.set_text_color(31, 41, 55)
    how_text = (
        "Orion-X utilizes a cutting-edge technical stack to ensure scalability and speed:\n\n"
        "- Intelligence Engine (Backend): Built with FastAPI (Python 3.12). It leverages asynchronous processing to handle AI orchestrations efficiently.\n"
        "- Interactive Interface (Frontend): A modern React 19 application using Vite for lightning-fast delivery. Framer Motion is used to provide a premium, smooth user experience.\n"
        "- AI Orchestration: The system integrates Google Gemini 2.0 Flash for rapid-fire quiz generation and Gemini Pro for complex Retrieval-Augmented Generation (RAG).\n"
        "- Data Integrity: PostgreSQL (managed via Supabase) provides a robust relational database, while Supabase Storage handles secure asset hosting."
    )
    pdf.multi_cell(0, 7, how_text)
    pdf.ln(5)

    # 3. WHAT
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(79, 70, 229)
    pdf.cell(0, 10, '3. WHAT: Key Features & Accomplishments', ln=True)
    pdf.set_font('helvetica', '', 12)
    pdf.set_text_color(31, 41, 55)
    what_text = (
        "- Smart Content Parsing: Automatically extracts and structures knowledge from raw PDFs.\n"
        "- AI Quiz Architect: Generates context-aware multiple-choice questions in seconds, reducing teacher workload by 80%.\n"
        "- RAG AI Tutor: Provides an intelligent chat interface that 'knows' the specific context of your course materials.\n"
        "- Dynamic Study Roadmaps: Offers summaries, key definitions, and estimated study times for every module.\n"
        "- Virtual Classroom Integration: One-click video sessions via Jitsi Meet."
    )
    pdf.multi_cell(0, 7, what_text)
    pdf.ln(5)

    # 4. WHERE
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(79, 70, 229)
    pdf.cell(0, 10, '4. WHERE: Use Cases & Application', ln=True)
    pdf.set_font('helvetica', '', 12)
    pdf.set_text_color(31, 41, 55)
    where_text = (
        "Orion-X is designed for versatility across various learning landscapes:\n\n"
        "- Educational Institutions: Universities and schools aiming to modernize their LMS.\n"
        "- Corporate Performance: Companies looking for smarter ways to onboard and train employees on technical documentation.\n"
        "- Independent Learners: Individuals seeking a personalized AI tutor that stays grounded in specific textbooks or papers.\n"
        "- Remote Collaboration: Teams that need combined video conferencing and collaborative AI knowledge tools."
    )
    pdf.multi_cell(0, 7, where_text)
    pdf.ln(10)

    # --- Conclusion ---
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(17, 24, 39)
    pdf.cell(0, 10, 'Closing Statement', ln=True, align='C')
    pdf.set_font('helvetica', 'I', 12)
    pdf.set_text_color(75, 85, 99)
    pdf.multi_cell(0, 7, "Orion-X represents the next evolution of educational technology: shifting from a paradigm of hosting information to a reality of providing intelligence.", align='C')

    output_path = r"c:/Users/HP/Desktop/Projects/orion-x/Orion-X_Project_Overview.pdf"
    pdf.output(output_path)
    return output_path

if __name__ == "__main__":
    try:
        path = generate_documentation()
        print(f"SUCCESS: PDF generated at {path}")
    except Exception as e:
        print(f"ERROR: {str(e)}")
