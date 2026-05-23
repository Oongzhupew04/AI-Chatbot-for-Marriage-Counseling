import os
import json
from dotenv import load_dotenv
from langchain_community.document_loaders import UnstructuredMarkdownLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_opengauss import OpenGauss, OpenGaussSettings

load_dotenv()

def create_vector_db():
    # ==========================================
    # 1. DYNAMIC PATH CONFIGURATION
    # ==========================================
    script_dir = os.path.dirname(os.path.abspath(__file__))
    KNOWLEDGE_BASE_DIR = os.path.join(script_dir, "RAG_Knowledge_Base")
    
    print(f"Reading markdown files from: {KNOWLEDGE_BASE_DIR}\n")

    # ==========================================
    # 2. SMART LOAD AND SPLIT DOCUMENTS
    # ==========================================
    TRACKER_FILE = os.path.join(script_dir, "processed_md_files.json")
    
    # A. Check the memory bank for already processed files
    if os.path.exists(TRACKER_FILE):
        with open(TRACKER_FILE, "r") as f:
            processed_files = set(json.load(f))
    else:
        processed_files = set()

    # B. Scan the folder for ALL markdown files
    all_files = []
    for root, dirs, files in os.walk(KNOWLEDGE_BASE_DIR):
        for file in files:
            if file.endswith(".md"):
                all_files.append(os.path.join(root, file))

    # C. Filter out the ones we already did
    new_files = [f for f in all_files if f not in processed_files]

    if not new_files:
        print("No new markdown files found. Your openGauss database is already up to date!")
        return

    print(f"Found {len(new_files)} new file(s) to process...")

    # D. Load ONLY the new files
    documents = []
    for file_path in new_files:
        loader = UnstructuredMarkdownLoader(file_path)
        documents.extend(loader.load())
        
    print("Splitting text into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200 
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} searchable chunks.")

    # ==========================================
    # 3. CREATE VECTOR DATABASE IN OPENGAUSS
    # ==========================================
    print("3. Loading Embedding Model & Connecting to openGauss...")
    embeddings = HuggingFaceEmbeddings(
        model_name="BAAI/bge-large-en-v1.5",
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )

    # 2. Configure openGauss Settings (HNSW is specified here)
    config = OpenGaussSettings(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)), 
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        table_name="counseling_knowledge",
        embedding_dimension=1024,
        index_type="hnsw",
        distance_strategy="euclidean"
    )

    # 3. Push documents and embeddings directly into the openGauss server
    vector_db = OpenGauss.from_documents(
        documents=chunks, 
        embedding=embeddings, 
        config=config
    )
    
    print("\nSuccess! Vector database permanently saved to the openGauss server.")

    # ==========================================
    # 4. UPDATE THE TRACKER
    # ==========================================
    processed_files.update(new_files)
    with open(TRACKER_FILE, "w") as f:
        json.dump(list(processed_files), f, indent=4)
    print(f"Memory bank updated! Tracking {len(processed_files)} total files.")

if __name__ == "__main__":
    create_vector_db()