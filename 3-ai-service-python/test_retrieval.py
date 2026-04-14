import time
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

print("Loading embedding model into RAM (this is the only slow part)...")
start_time = time.time()

# 1. Hardware Optimization
# Change 'cpu' to 'cuda' if you have an Nvidia graphics card
model_kwargs = {'device': 'cpu'} 

# 2. Updated LangChain Imports
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs=model_kwargs
)

vector_db = Chroma(persist_directory="chroma_db", embedding_function=embeddings)

print(f"Model loaded in {time.time() - start_time:.2f} seconds.\n")

# 3. Simulate a user's complaint
user_complaint = "My husband keeps buying expensive things without telling me and it scares me."

print(f"User says: '{user_complaint}'")
print("Searching database...\n")

search_start = time.time()
# Search the database for the top 2 most relevant chunks
results = vector_db.similarity_search(user_complaint, k=2)

print(f"Search completed in {time.time() - search_start:.4f} seconds!\n")

for i, doc in enumerate(results):
    print(f"--- MATCH {i+1} ---")
    print(doc.page_content)
    print("\n")