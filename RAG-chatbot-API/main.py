from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from pydantic import BaseModel
import os
from typing import Dict, List, Optional
import time
import google.generativeai as genai
from langchain_community.document_loaders import CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    try:
        initialize_model()
    except Exception as e:
        print(f"Error during initialization: {str(e)}")
    yield
    # Shutdown code (if any)
    
# Initialize FastAPI app
app = FastAPI(title="Comprehensive Animal Information API", lifespan=lifespan)

# Pydantic models
class Query(BaseModel):
    question: str
    enable_general_knowledge: bool = True

class RAGResponse(BaseModel):
    answer: str
    source_type: str  # "knowledge_base", "general_model", or "combined"
    metrics: Dict
    sources: Optional[List[str]] = None

# Global variables
vector_store = None
rag_chain = None
general_llm = None

def load_documents(csv_path: str):
    """Load documents from CSV file"""
    try:
        loader = CSVLoader(file_path=csv_path, encoding='utf-8')
        documents = loader.load()
        return documents
    except Exception as e:
        print(f"Error loading documents: {str(e)}")
        raise

def split_documents(documents):
    """Split documents into chunks"""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    split_docs = text_splitter.split_documents(documents)
    return split_docs

def setup_vector_store(documents, save_path: str = "RAG-chatbot-API/FAISS"):
    """Initialize or load the vector store using FAISS"""
    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2"
    )
    
    # Create a new vector store if the directory doesn't exist
    if not os.path.exists(save_path):
        vector_store = FAISS.from_documents(
            documents=documents,
            embedding=embedding_model
        )
        vector_store.save_local(save_path)
    else:
        # Load existing vector store
        vector_store = FAISS.load_local(
            folder_path=save_path,
            embeddings=embedding_model,
            allow_dangerous_deserialization=True
        )
    
    return vector_store

def setup_gemini_llm(temperature=0.2, max_tokens=512):
    """Setup Google Gemini LLM"""
    # Get API key from environment variables
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")
    
    # Configure the Gemini API
    genai.configure(api_key=api_key)
    
    # Initialize the LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-lite", 
        google_api_key=api_key,
        temperature=temperature,
        max_output_tokens=max_tokens
    )
    
    return llm

def create_rag_chain(vector_store, llm):
    """Create RAG chain for veterinary disease knowledge base"""
    rag_prompt = PromptTemplate.from_template(
        """Answer the question using the provided context about animal health, diseases, and veterinary information.  
        
        IMPORTANT: Your answer MUST be concise and no longer than 3 lines maximum. Focus only on the most essential information.
        
        Follow these guidelines:
        1. If the question is about animal diseases, health, or veterinary topics AND information is found in the context, provide a brief, focused answer based on the context.
        2. If the question is about animals but NOT about diseases/health AND no relevant information is in the context, respond with: "REQUIRES_GENERAL_KNOWLEDGE".
        3. If the question is NOT about animals at all, respond with: "OFF_TOPIC".
        
        Do not invent information that isn't in the context for veterinary/disease questions. Stick to facts from the provided context.
        
        Context: {context} 
        Question: {question}
        
        Answer (3 lines maximum):"""
    )
    
    # Create the RAG chain
    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vector_store.as_retriever(search_kwargs={"k": 5}),
        chain_type_kwargs={"prompt": rag_prompt},
        return_source_documents=True
    )
    
    return chain

def get_general_animal_answer(question, llm):
    """Get answer from general knowledge for non-disease animal questions"""
    prompt = PromptTemplate.from_template(
        """You are a helpful AI expert on animals. Answer the following question about animals 
        (NOT about animal diseases or veterinary topics, as those are handled by a different system).
        
        IMPORTANT: Your answer MUST be concise and no longer than 3 lines maximum. Focus only on the most essential information.
        
        Only answer if the question is about animals, animal behavior, habitats, species, biology, 
        or other general animal topics. If the question is not about animals, respond with: "This question is not about animals."
        
        Provide accurate, focused information based on scientific knowledge about animals.
        
        Question: {question}
        
        Answer (3 lines maximum):"""
    )
    
    # Format the prompt with the question
    formatted_prompt = prompt.format(question=question)
    
    # Get response from the LLM
    response = llm.invoke(formatted_prompt)
    
    return response.content

def is_about_animals(question, llm):
    """Determine if a question is about animals"""
    prompt = PromptTemplate.from_template(
        """Determine if the following question is related to animals in ANY way (including wild animals, pets, farm animals, 
        animal biology, behavior, species, etc.).
        
        Question: {question}
        
        Respond with ONLY ONE of these exact phrases:
        - "YES" if the question is about animals in any way
        - "NO" if the question is not about animals
        
        Response:"""
    )
    
    # Format the prompt with the question
    formatted_prompt = prompt.format(question=question)
    
    # Get response from the LLM
    response = llm.invoke(formatted_prompt)
    
    return response.content.strip().upper() == "YES"

def initialize_model():
    """Initialize the RAG model with all components"""
    global vector_store, rag_chain, general_llm
    
    # Check if data exists and load it
    csv_path = "RAG-chatbot-API/data.csv"
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")
    
    # Load and process documents
    documents = load_documents(csv_path)
    split_docs = split_documents(documents)
    
    # Setup vector store
    vector_store = setup_vector_store(split_docs)
    
    # Setup Gemini LLMs
    rag_llm = setup_gemini_llm(temperature=0.1)  # Lower temperature for factual retrieval
    general_llm = setup_gemini_llm(temperature=0.3, max_tokens=1024)  # Slightly higher temperature for general knowledge
    
    # Create RAG chain
    rag_chain = create_rag_chain(vector_store, rag_llm)

@app.get("/")
async def root():
    """Root endpoint to check API status"""
    return {
        "message": "Comprehensive Animal Information API is running",
        "status": "healthy" if rag_chain is not None and general_llm is not None else "model not initialized"
    }

@app.post("/ask", response_model=RAGResponse)
async def ask_question(query: Query):
    """Endpoint to answer animal-related questions"""
    if not rag_chain or not general_llm:
        try:
            initialize_model()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model initialization failed: {str(e)}")
    
    try:
        # Measure performance
        start_time = time.time()
        
        # Check if question is about animals
        if not is_about_animals(query.question, general_llm):
            # Not about animals at all
            return RAGResponse(
                answer="I'm specifically designed to answer questions about animals. Your question appears to be about something else. Please ask me about animals, their behavior, habitats, species, or health.",
                source_type="off_topic",
                metrics={"time_taken": round(time.time() - start_time, 2), "model": "gemini-2.0-flash-lite"}
            )
            
        # First try with the RAG system for veterinary knowledge
        rag_result = rag_chain.invoke({"query": query.question})
        rag_answer = rag_result["result"].strip()
        
        # Extract source documents for citation
        sources = []
        if "source_documents" in rag_result:
            for doc in rag_result["source_documents"]:
                if hasattr(doc, "metadata") and "source" in doc.metadata:
                    sources.append(doc.metadata["source"])
        
        # Check if RAG system could answer or if we need general knowledge
        if "REQUIRES_GENERAL_KNOWLEDGE" in rag_answer and query.enable_general_knowledge:
            # Get answer from general knowledge
            general_answer = get_general_animal_answer(query.question, general_llm)
            
            # Calculate metrics
            end_time = time.time()
            time_taken = end_time - start_time
            
            return RAGResponse(
                answer=general_answer,
                source_type="general_model",
                metrics={
                    "time_taken": round(time_taken, 2),
                    "model": "gemini-2.0-flash-lite"
                }
            )
        
        elif "OFF_TOPIC" in rag_answer:
            # Not about animals
            return RAGResponse(
                answer="I'm specifically designed to answer questions about animals. Your question appears to be about something else. Please ask me about animals, their behavior, habitats, species, or health. also if the questions is releated to the animals still answer those questions in maximium of 3 lines only.",
                source_type="off_topic",
                metrics={"time_taken": round(time.time() - start_time, 2), "model": "gemini-2.0-flash-lite"}
            )
        
        else:
            # Calculate metrics
            end_time = time.time()
            time_taken = end_time - start_time
            
            return RAGResponse(
                answer=rag_answer,
                source_type="knowledge_base",
                metrics={
                    "time_taken": round(time_taken, 2),
                    "model": "gemini-2.0-flash-lite"
                },
                sources=list(set(sources)) if sources else None
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)