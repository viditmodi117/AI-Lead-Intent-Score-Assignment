from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

# Initializing FastAPI app
app = FastAPI()

# Adding CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Defining input data model
class Lead(BaseModel):
    phone_number: str
    email: str
    credit_score: int
    age_group: str
    family_background: str
    income: int
    property_type: str
    budget: int
    preferred_location: str
    comments: Optional[str] = ""

# Loading pre-trained model
model = joblib.load("model/lead_scoring_model.joblib")
#

# In-memory storage for leads
leads_storage = []

# Defining rule-based reranker
def rerank_score(initial_score: float, comments: str) -> float:
    score = initial_score
    comments = comments.lower()
    positive_keywords = ["urgent", "immediate", "looking to move", "call me asap", "finalizing"]
    negative_keywords = ["not now", "just exploring", "budget issue", "need loan"]
    
    for keyword in positive_keywords:
        if keyword in comments:
            score += 10
    for keyword in negative_keywords:
        if keyword in comments:
            score -= 10
    
    return max(0, min(100, score))

# Defining score endpoint
@app.post("/score")
async def score_lead(lead: Lead):
    # Validating input
    if not "@" in lead.email or lead.credit_score < 300 or lead.credit_score > 850:
        raise HTTPException(status_code=400, detail="Invalid email or credit score")
    if lead.income < 0 or lead.budget < 0:
        raise HTTPException(status_code=400, detail="Income or budget cannot be negative")
    
    # Preparing data for model
    input_data = pd.DataFrame([{
        "credit_score": lead.credit_score,
        "income": lead.income,
        "budget": lead.budget,
        "age_group_18-25": 1 if lead.age_group == "18-25" else 0,
        "age_group_26-35": 1 if lead.age_group == "26-35" else 0,
        "age_group_36-50": 1 if lead.age_group == "36-50" else 0,
        "age_group_51+": 1 if lead.age_group == "51+" else 0,
        "family_background_Single": 1 if lead.family_background == "Single" else 0,
        "family_background_Married": 1 if lead.family_background == "Married" else 0,
        "family_background_Married with Kids": 1 if lead.family_background == "Married with Kids" else 0,
        "property_type_Apartment": 1 if lead.property_type == "Apartment" else 0,
        "property_type_Villa": 1 if lead.property_type == "Villa" else 0,
        "property_type_Plot": 1 if lead.property_type == "Plot" else 0,
        "property_type_Commercial": 1 if lead.property_type == "Commercial" else 0,
        "preferred_location_Noida": 1 if lead.preferred_location == "Noida" else 0,
        "preferred_location_Delhi": 1 if lead.preferred_location == "Delhi" else 0,
        "preferred_location_Mumbai": 1 if lead.preferred_location == "Mumbai" else 0,
        "preferred_location_Bangalore": 1 if lead.preferred_location == "Bangalore" else 0,
        "preferred_location_Hyderabad": 1 if lead.preferred_location == "Hyderabad" else 0,
        "preferred_location_Ahmedabad": 1 if lead.preferred_location == "Ahmedabad" else 0,
        "preferred_location_Chennai": 1 if lead.preferred_location == "Chennai" else 0,
        "preferred_location_Surat": 1 if lead.preferred_location == "Surat" else 0,
        "preferred_location_Jaipur": 1 if lead.preferred_location == "Jaipur" else 0,
        "preferred_location_Pune": 1 if lead.preferred_location == "Pune" else 0,
    }])
    
    # Predicting initial score
    initial_score = model.predict_proba(input_data)[0][1] * 100
    reranked_score = rerank_score(initial_score, lead.comments or "")
    
    # Storing lead
    lead_dict = lead.dict()
    lead_dict["initial_score"] = round(initial_score, 2)
    lead_dict["reranked_score"] = round(reranked_score, 2)
    leads_storage.append(lead_dict)
    
    return {"initial_score": round(initial_score, 2), "reranked_score": round(reranked_score, 2)}
