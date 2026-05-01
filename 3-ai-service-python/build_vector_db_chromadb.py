import os
import time
from langchain_community.document_loaders import DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma

def create_vector_db():
    # ==========================================
    # 1. DYNAMIC PATH CONFIGURATION
    # ==========================================
    # Get the absolute path of the directory containing this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define exact paths based on the script's location
    KNOWLEDGE_BASE_DIR = os.path.join(script_dir, "RAG_Knowledge_Base")
    DB_DIR = os.path.join(script_dir, "chroma_db")
    
    print(f"Reading markdown files from: {KNOWLEDGE_BASE_DIR}")
    print(f"Saving vector database to: {DB_DIR}\n")

    # ==========================================
    # 2. LOAD AND SPLIT DOCUMENTS
    # ==========================================
    print("1. Loading Markdown files...")
    # Load all .md files from your dynamically located folder
    loader = DirectoryLoader(KNOWLEDGE_BASE_DIR, glob="**/*.md")
    documents = loader.load()
    
    if len(documents) == 0:
        print("ERROR: No markdown files found! Please run your markdown generator first.")
        return
        
    print(f"Loaded {len(documents)} documents.")

    print("2. Splitting text into chunks...")
    # We split the text so we don't overwhelm the 1.5B model's memory
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, # Number of characters per chunk
        chunk_overlap=50  # Overlap keeps context between chunks
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} searchable chunks.")

    # ==========================================
    # 3. CREATE VECTOR DATABASE
    # ==========================================
    print("3. Loading Embedding Model & Creating Database...")
    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )

    # Create the Chroma database and save it to the absolute disk path
    vector_db = Chroma.from_documents(
        documents=chunks, 
        embedding=embeddings, 
        persist_directory=DB_DIR
    )
    
    print(f"\nSuccess! Vector database permanently saved locally to:\n{DB_DIR}")

if __name__ == "__main__":
    create_vector_db()