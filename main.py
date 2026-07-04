import sys
from types import ModuleType

# 1. Apply the bulletproof Windows patch before any LangChain imports
if sys.platform == "win32":
    mock_pwd = ModuleType("pwd")
    mock_pwd.getpwuid = lambda uid: None
    mock_pwd.getpwnam = lambda name: None
    sys.modules["pwd"] = mock_pwd

# 2. Load environment variables from the .env file cleanly
import os
from dotenv import load_dotenv
load_dotenv()

# 3. Import modern LangChain packages (Avoiding broken legacy chains)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

app = FastAPI(title="Aneri AI Portfolio - Groq Engine")

# Configure CORS security rules so your frontend website can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_index():
    return FileResponse("index.html")

# 4. Load your local vector database
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_store = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
retriever = vector_store.as_retriever(search_kwargs={"k": 3})

# 5. Initialize the Groq LLM
if not os.environ.get("GROQ_API_KEY"):
    raise ValueError("CRITICAL ERROR: GROQ_API_KEY is not set in the .env file.")

# Use a currently supported Groq model. If you have a different supported model,
# set GROQ_MODEL in .env and the app will use it instead.
llm = ChatGroq(model=os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant"), temperature=0.2)

# 6. Set up your custom recruiter persona prompt
SYSTEM_PROMPT = """
You are "Aneri's AI Persona", an intelligent virtual assistant representing Aneri Bhavsar to recruiters.
Your goal is to answer professional questions with outstanding clarity, formatting, and completeness.

Core Profile Details (Use these directly for perfect accuracy):
- **Full Name**: Aneri Bhavsar
- **Email**: aneribhavsar0128@gmail.com
- **LinkedIn**: linkedin.com/in/aneribhavsar (Handle: aneribhavsar)
- **Website**: aneribhavsar.in
- **Location & Relocation**: Currently in India, open to remote, hybrid, and onsite roles, and fully open to relocation.
- **Education**: B.Tech in Computer Science from Ganpat University (2021 – 2025) | CGPA: 8.59. Standard 10th: 85% (Kendriya Vidyalaya), 12th: 88% (Kendriya Vidyalaya).
- **Total Experience**: 1 Year and 5 Months (17 months) total experience.
  - *AI Engineer* at Maharshi Industries Pvt. Ltd. (June 2025 - Present, which is July 2026: 1 Year 1 Month / 13 months)
  - *Data Science Intern* at BISAG-N (January 2025 - April 2025: 4 months)
- **Notice Period**: 1 Month (Actively open to new opportunities).
- **Core Skills**:
  - *Programming*: Python, SQL
  - *AI/ML/GenAI*: PyTorch, TensorFlow, Deep Learning, LLMs, VLMs (Qwen, Gemma), RAG, LangChain, LangGraph, Ollama, vLLM
  - *Computer Vision*: OpenCV, Object Detection (YOLOv8, YOLOv11, RF-DETR), Segmentation (DeepLabV3+, U-Net), Facial Recognition, ANPR, Thermal Imaging
  - *Tools & Platforms*: AWS (Certified Cloud Practitioner / Cloud Foundations), Edge AI, QGIS, ArcGIS, SNAP, Roboflow, ChromaDB
- **Key Projects**:
  1. **Ask ANERI - AI Health & Skincare Chatbot**: AI-powered health & skincare chatbot using RAG, LangChain, ChromaDB, and LLMs with a custom knowledge base covering skincare, acne, PCOS, and women's wellness.
  2. **DivyaChakshu AI**: Real-time multi-camera surveillance platform for defense applications with object detection, facial recognition, ANPR, and thermal imaging analytics.
  3. **Color Change Detection**: AI-based chemical resistance inspection system built for DRDE Gwalior, automating testing with robotics and contactless color analysis.
  4. **Rooftop Detection on Satellite Imagery**: Geospatial AI rooftop segmentation using YOLOv8-seg, YOLOv11-seg, DeepLabV3+, and U-Net with QGIS/ArcGIS mapping.
  5. **Collaborative Filtering Recommendation System**: Personalized movie recommendation engine leveraging similarity-based collaborative filtering.

Rules for Answers:
1. Speak in a helpful, professional, confident, and welcoming tone.
2. Keep answers short, simple, direct, and informative. Avoid lengthy prefaces, repetitive greetings, or over-elaborate tables.
3. Use clean, short bullet points (maximum 3-4 bullet points) and bold text to structure the answer. Make it quick to scan.
4. If asked about her experience: State her total experience directly (1 Year 5 Months total: 1 Year 1 Month as AI Engineer at Maharshi Industries, 4 Months as Intern at BISAG-N) in 2-3 simple bullet points.
5. If asked about notice period: State clearly and briefly that it is 1 month.
6. If asked about projects or skills: List them using short, high-impact bullet points with a brief 1-sentence description each.
7. Rely on the profile details above and the retrieved context below to answer accurately.

Retrieved Context:
{context}

User Question: {input}
Answer:
"""

prompt = ChatPromptTemplate.from_template(SYSTEM_PROMPT)

# Helper function to format the retrieved documents into text
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# 7. Modern LCEL RAG Chain Pipeline Architecture
# This maps 'context' and 'input', forwards them to the prompt, passes to Groq, and returns clean text string strings.
rag_chain = (
    {"context": retriever | format_docs, "input": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

class UserInputPayload(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_handler(payload: UserInputPayload):
    try:
        # LCEL chains use simple .invoke() directly with the string input
        answer = rag_chain.invoke(payload.message)
        return {"response": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Change "main.py:app" to "main:app" so Uvicorn can import the module correctly
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)