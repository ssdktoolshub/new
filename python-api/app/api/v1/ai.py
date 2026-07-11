from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import re

router = APIRouter()

class SummarizeRequest(BaseModel):
    text: str
    ratio: Optional[float] = 0.3
    extract_entities: Optional[bool] = False

class SummarizeResponse(BaseModel):
    summary: str
    entities: Optional[dict] = None

class GenerateRequest(BaseModel):
    prompt: str
    tone: Optional[str] = "professional"
    type: Optional[str] = "blog-intro"

class GenerateResponse(BaseModel):
    text: str

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(payload: SummarizeRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty")
    
    # 1. Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', payload.text.strip())
    if len(sentences) <= 3:
        return SummarizeResponse(summary=payload.text, entities={})

    # 2. Basic word frequency calculation
    words = re.findall(r'\b[a-zA-Z]{3,}\b', payload.text.lower())
    stop_words = {"the", "and", "a", "of", "to", "is", "in", "it", "that", "this", "for", "on", "with", "as", "at", "by", "an", "be", "was"}
    
    freqs = {}
    for w in words:
        if w not in stop_words:
            freqs[w] = freqs.get(w, 0) + 1

    # 3. Score sentences
    scored = []
    for s in sentences:
        s_words = re.findall(r'\b[a-zA-Z]{3,}\b', s.lower())
        score = sum(freqs.get(w, 0) for w in s_words)
        scored.append((s, score))

    # Sort and pick top sentences based on ratio
    num_sentences = max(1, int(len(sentences) * payload.ratio))
    top_sentences = sorted(scored, key=lambda x: x[1], reverse=True)[:num_sentences]
    top_sentences_text = {s[0] for s in top_sentences}

    summary = " ".join(s for s in sentences if s in top_sentences_text)

    # 4. Extract entities if requested (names, dates, values)
    entities = {}
    if payload.extract_entities:
        # Regex matching dates (e.g. 2026, June 28)
        entities["dates"] = list(set(re.findall(r'\b(?:19|20)\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}\b', payload.text)))
        # Match percentages and currencies
        entities["metrics"] = list(set(re.findall(r'\b\d+(?:[\.,]\d+)?%\b|\$\d+(?:[\.,]\d+)?\b', payload.text)))
        # Match capitalized words (potential entities)
        entities["names"] = list(set(re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', payload.text)))

    return SummarizeResponse(summary=summary, entities=entities)

@router.post("/generate", response_model=GenerateResponse)
async def generate_content(payload: GenerateRequest):
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    # Mock dynamic template generation rules
    prompt = payload.prompt.strip()
    tone = payload.tone
    type_ = payload.type

    # Sample compiled outlines
    if type_ == "blog-intro":
        text = f"In today's fast-paced digital world, '{prompt}' has emerged as a key focal point. Writing in a {tone} tone, this overview covers the fundamental aspects of the topic, outlining why understanding its core dynamics is critical for modern creators seeking to optimize their workflows."
    elif type_ == "email":
        text = f"Dear Colleague,\n\nI am writing to discuss '{prompt}'. Adopting a {tone} style, I believe it would be beneficial to collaborate on this topic to align our current project scopes. Let me know your thoughts.\n\nBest regards,\nSwarnava"
    else:
        text = f"Catchy Headline: '{prompt.upper()}' - The Ultimate Guide! (Tone: {tone})"

    return GenerateResponse(text=text)
