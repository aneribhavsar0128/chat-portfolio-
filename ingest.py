import sys
from types import ModuleType

# Trick Windows into thinking the Linux 'pwd' module exists in memory
if sys.platform == "win32":
    mock_pwd = ModuleType("pwd")
    # Add dummy functions that the internal LangChain files expect to find
    mock_pwd.getpwuid = lambda uid: None
    mock_pwd.getpwnam = lambda name: None
    sys.modules["pwd"] = mock_pwd

# -------------------------------------------------------------
# Now it is safe to import LangChain elements without crashes!
# -------------------------------------------------------------
import os
from langchain_community.document_loaders.pdf import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

def run_ingestion():
    # List of your PDF data source assets[cite: 2]
    pdf_files = [
        r"C:\Users\admin\Desktop\Chat-portfolio\data\Resume_Aneri Bhavsar.pdf",
        r"C:\Users\admin\Desktop\Chat-portfolio\data\Aneri_Knowledge_Base.pdf"
    ]
    
    all_documents = []
    
    print("Loading and parsing PDF sources...")
    for file_path in pdf_files:
        if os.path.exists(file_path):
            print(f"-> Reading: {file_path}")
            loader = PyPDFLoader(file_path)
            all_documents.extend(loader.load())
        else:
            print(f"Warning: File not found at {file_path}. Skipping.")

    if not all_documents:
        print("Error: No documents were loaded. Verify file paths.")
        return

    print(f"Total pages extracted: {len(all_documents)}")

    print("Splitting text into optimized semantic chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_documents(all_documents)
    print(f"Generated {len(chunks)} text chunks.")

    print("Initializing local HuggingFace Embeddings (all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    print("Building local ChromaDB vector store index...")
    Chroma.from_documents(chunks, embeddings, persist_directory="./chroma_db")
    print("Vector database successfully initialized at ./chroma_db with both files!")

if __name__ == "__main__":
    run_ingestion()