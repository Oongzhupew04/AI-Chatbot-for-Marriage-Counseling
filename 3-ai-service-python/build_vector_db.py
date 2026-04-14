import os
from langchain_community.document_loaders import DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# 1. Define the paths
KNOWLEDGE_BASE_DIR = "RAG_Knowledge_Base"
DB_DIR = "chroma_db" # The folder where your database will be saved

def create_vector_db():
    print("1. Loading Markdown files...")
    # Load all .md files from your generated folder
    loader = DirectoryLoader(KNOWLEDGE_BASE_DIR, glob="**/*.md")
    documents = loader.load()
    print(f"Loaded {len(documents)} documents.")

    print("2. Splitting text into chunks...")
    # We split the text so we don't overwhelm the 1.5B model's memory
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, # Number of characters per chunk
        chunk_overlap=50  # Overlap keeps context between chunks
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} searchable chunks.")

    print("3. Downloading Embedding Model & Creating Database...")
    # This downloads the lightweight translation model we discussed earlier
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # Create the Chroma database and save it to your disk
    vector_db = Chroma.from_documents(
        documents=chunks, 
        embedding=embeddings, 
        persist_directory=DB_DIR
    )
    
    print(f"Success! Vector database saved locally to the '{DB_DIR}' folder.")

if __name__ == "__main__":
    create_vector_db()