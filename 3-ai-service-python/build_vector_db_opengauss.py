import os
from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader
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
    # 2. LOAD AND SPLIT DOCUMENTS
    # ==========================================
    print("1. Loading Markdown files...")
    loader = DirectoryLoader(KNOWLEDGE_BASE_DIR, glob="**/*.md")
    documents = loader.load()
    
    if len(documents) == 0:
        print("ERROR: No markdown files found! Please run your markdown generator first.")
        return
        
    print(f"Loaded {len(documents)} documents.")

    print("2. Splitting text into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50 
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} searchable chunks.")

    # ==========================================
    # 3. CREATE VECTOR DATABASE IN OPENGAUSS
    # ==========================================
    print("3. Loading Embedding Model & Connecting to openGauss...")
    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )

    # 2. Configure openGauss Settings (HNSW is specified here)
    config = OpenGaussSettings(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", 5432)), 
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        table_name="counseling_knowledge",
        embedding_dimension=384,
        index_type="ivfflat",
        distance_strategy="cosine"
    )

    # 3. Push documents and embeddings directly into the openGauss server
    vector_db = OpenGauss.from_documents(
        documents=chunks, 
        embedding=embeddings, 
        config=config
    )
    
    print("\nSuccess! Vector database permanently saved to the openGauss server.")

if __name__ == "__main__":
    create_vector_db()