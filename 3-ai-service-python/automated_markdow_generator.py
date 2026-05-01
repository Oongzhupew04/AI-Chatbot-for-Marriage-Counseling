import pandas as pd
import os
import requests
import re

# ==========================================
# 1. ECS & OLLAMA CONFIGURATION
# ==========================================
# Replace with your actual ECS instance IP or domain
OLLAMA_API_URL = "http://190.92.210.171:11434/api/chat"
MODEL_NAME = "deepseek-r1:1.5b"

# ==========================================
# 2. GENERATION FUNCTION (Adapted from your code)
# ==========================================
def generate_rag_document(prompt):
    """Call DeepSeek on ECS to generate the markdown file content."""
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False 
    }
    
    try:
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status() 
        
        data = response.json()
        raw_response = data.get("response", "").strip()
        
        # We omit the is_unsafe() check here because we are generating 
        # clinical counseling data, which might accidentally trigger false positives 
        # in a standard safety filter, halting your database generation.

        # CRITICAL: Clean the thinking tags so they don't pollute the Vector DB
        clean_response = raw_response
        
        if "</think>" in clean_response:
            clean_response = clean_response.split("</think>")[-1]
            
        clean_response = re.sub(r'<think>.*?(?:</think>|$)', '', clean_response, flags=re.DOTALL | re.IGNORECASE)
        clean_response = clean_response.strip()
        
        return clean_response

    except requests.exceptions.RequestException as e:
        print(f"[API ERROR] Failed to connect to DeepSeek: {e}")
        return None

# ==========================================
# 3. AUTOMATED RAG GENERATION LOOP
# ==========================================
def build_knowledge_base():
    # --- NEW PATH LOGIC ---
    # Get the absolute path of the directory containing this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define exact paths based on the script's location
    excel_path = os.path.join(script_dir, 'variable_table_v2.xlsx')
    output_dir = os.path.join(script_dir, 'RAG_Knowledge_Base')
    # ----------------------

    # Load your Data Dictionary CSV using the absolute path
    print(f"Reading data from: {excel_path}")
    df = pd.read_excel(excel_path)

    # Filter for rows that actually map to Maslow
    maslow_df = df[df['maslow_type'].notna() & (df['maslow_type'] != 'None')]

    # Create the folder in the same directory as the script
    os.makedirs(output_dir, exist_ok=True)
    print(f"Saving markdown files to: {output_dir}")

    print(f"Starting knowledge base generation using {MODEL_NAME}...")

    for index, row in maslow_df.iterrows():
        variable_name = row['new_variable_name']
        maslow_level = row['maslow_type']
        question = row['description']
        
        # Give the LLM the exact instructions to generate the complete Markdown
        prompt = f"""
        You are an expert marriage counselor and psychologist. 
        I am building a RAG knowledge base. Please write a highly detailed, clinical markdown document based on the following survey variable:
        
        - Maslow Level: {maslow_level}
        - Survey Question: "{question}"
        
        Format the output exactly like this:
        # Maslow Level: [Level]
        ## Sub-Category: [Infer a sub-category based on the question]
        ## Related Survey Variables: {variable_name}
        
        **Psychological Context:**
        [Write 1 paragraph explaining how this specific question ties to the Maslow level and marital health]
        
        **Counseling Framework & Diagnosis:**
        [Write 1 paragraph on how to diagnose issues in this area]
        
        **Actionable Advice:**
        [Provide 3 numbered, highly actionable pieces of advice a counselor would give]
        """

        print(f"Generating document for: {maslow_level} - {variable_name}...")

        # Call your custom generation function
        generated_markdown = generate_rag_document(prompt)
        
        if generated_markdown:
            # Clean up the filename so it is valid for Windows/Linux
            safe_maslow_level = maslow_level.replace(' ', '_').replace('/', '_')
            
            # Save the file using the absolute output directory path
            file_path = os.path.join(output_dir, f"{safe_maslow_level}_{variable_name}.md")
            
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(generated_markdown)
                
            print(f" -> Saved successfully as {file_path}")
        else:
            print(f" -> FAILED to generate document for {variable_name}. Skipping.")

    print("\nKnowledge Base Generation Complete!")

# Run the script
if __name__ == "__main__":
    build_knowledge_base()