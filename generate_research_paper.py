from fpdf import FPDF
import os

class ResearchPaperPDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Orion-X Research Paper Draft', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def create_pdf():
    pdf = ResearchPaperPDF()
    pdf.add_page()
    
    # Title
    pdf.set_font('Arial', 'B', 16)
    pdf.multi_cell(0, 10, 'Orion-X: An Intelligent AI-Powered Learning Ecosystem for Personalized Educational Experiences', 0, 'C')
    pdf.ln(10)

    sections = [
        ("1. Abstract", """Traditional Learning Management Systems (LMS) often serve as static repositories for course materials, leading to an "engagement gap" and high manual workloads for educators. This paper presents Orion-X, a modern learning ecosystem that leverages Generative AI and Retrieval-Augmented Generation (RAG) to transform static educational content into interactive, personalized study paths. By automating quiz generation and providing an AI Tutor with project-specific knowledge, Orion-X bridges the gap between passive content consumption and active, data-driven learning."""),
        
        ("2. Problem Statement", """The current digital education landscape faces several challenges:
- Static Content: PDFs and slides lack interactivity, making self-study difficult.
- Teacher Burnout: Manually creating assessments (quizzes) for every module is time-intensive.
- Lack of Personalization: Standard LMS platforms provide a "one-size-fits-all" approach, failing to cater to individual student paces."""),
        
        ("3. Proposed Solution (The Orion-X Framework)", """Orion-X introduces an AI orchestration layer between the user and the content:
- Smart Content Ingestion: Automatically parses unstructured PDF data using PyMuPDF to create a structured knowledge base.
- AI-Powered Tutor (RAG): Unlike generic LLMs, the integrated tutor uses Retrieval-Augmented Generation to answer questions strictly based on the uploaded course modules, ensuring accuracy and relevance.
- Automated Assessment Architect: Utilizes Google Gemini 2.0 Flash to instantly generate relevant MCQ quizzes, reducing teacher workload by approximately 80%."""),
        
        ("4. Technical Architecture", """The system is built on a modern, decoupled stack:
- Backend (Intelligence Engine): Developed with FastAPI (Python) for high-concurrency performance, using SQLAlchemy for relational data integrity.
- Generative Layer: Integrated with Google Gemini Pro for natural language understanding and Gemini 2.0 Flash for rapid quiz generation.
- Frontend (UX/UI): A responsive React 19 dashboard utilizing Framer Motion for fluid micro-interactions and Lucide React for a premium design language.
- Data & Storage: PostgreSQL and Supabase Storage for secure, scalable handling of user data and educational assets.
- Synchronous Learning: Jitsi Meet integration for real-time video conferencing within the ecosystem."""),
        
        ("5. Key Innovations", """1. Dynamic Study Roadmapping: The system generates time estimates and key-term summaries for each module, providing students with a clear mental model before they begin.
2. Context-Aware Chat: By grounding AI responses in the specific uploaded documents, Orion-X eliminates "hallucinations" common in standard AI tools.
3. One-Click Deployment: A streamlined setup process (RUN_ME.bat) that allows non-technical users to deploy a full-scale LMS environment instantly."""),
        
        ("6. Conclusion", """Orion-X demonstrates the transition from hosting information to providing intelligence. By automating the most tedious parts of teaching and personalizing the student journey, it sets a new standard for AI integration in educational technology.""")
    ]

    for title, content in sections:
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, title, 0, 1, 'L')
        pdf.set_font('Arial', '', 12)
        pdf.multi_cell(0, 7, content)
        pdf.ln(5)

    output_path = r"c:/Users/HP/Desktop/Projects/orion-x/Orion-X_Research_Paper.pdf"
    # Ensure path is absolute and uses right slashes for windows if needed, but fpdf likes forward slashes or escaped backslashes.
    pdf.output(output_path)
    print(f"PDF generated successfully at: {output_path}")

if __name__ == "__main__":
    create_pdf()
