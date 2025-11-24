from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Layer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    color: str
    icon: str
    visible: bool = True

class Marker(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    lat: float
    lng: float
    layer_id: str


# Routes
@api_router.get("/")
async def root():
    return {"message": "Ilhéus Interactive Map API"}

@api_router.get("/layers", response_model=List[Layer])
async def get_layers():
    layers = await db.layers.find({}, {"_id": 0}).to_list(1000)
    return layers

@api_router.get("/markers", response_model=List[Marker])
async def get_markers():
    markers = await db.markers.find({}, {"_id": 0}).to_list(1000)
    return markers

@api_router.get("/markers/layer/{layer_id}", response_model=List[Marker])
async def get_markers_by_layer(layer_id: str):
    markers = await db.markers.find({"layer_id": layer_id}, {"_id": 0}).to_list(1000)
    return markers


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Seed data on startup
@app.on_event("startup")
async def seed_database():
    # Check if data already exists
    existing_layers = await db.layers.count_documents({})
    
    if existing_layers == 0:
        logger.info("Seeding database with sample data for Ilhéus...")
        
        # Create layers
        layers = [
            {
                "id": "restaurants",
                "name": "Restaurantes",
                "color": "#FF6B6B",
                "icon": "restaurant",
                "visible": True
            },
            {
                "id": "hotels",
                "name": "Hotéis",
                "color": "#4ECDC4",
                "icon": "hotel",
                "visible": True
            },
            {
                "id": "tourist_sights",
                "name": "Pontos Turísticos",
                "color": "#FFD93D",
                "icon": "place",
                "visible": True
            },
            {
                "id": "beaches",
                "name": "Praias",
                "color": "#6EC1E4",
                "icon": "beach_access",
                "visible": True
            }
        ]
        
        # Create markers for Ilhéus
        markers = [
            # Restaurants
            {
                "id": str(uuid.uuid4()),
                "name": "Restaurante Barra Grande",
                "description": "Culinária regional com frutos do mar frescos e vista para o mar.",
                "lat": -14.7947,
                "lng": -39.0447,
                "layer_id": "restaurants"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pizzaria Tia Déia",
                "description": "Pizzas artesanais em forno à lenha, ambiente aconchegante.",
                "lat": -14.7889,
                "lng": -39.0495,
                "layer_id": "restaurants"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Vesúvio Bar",
                "description": "Bar histórico frequentado por Jorge Amado, petiscos tradicionais.",
                "lat": -14.7923,
                "lng": -39.0478,
                "layer_id": "restaurants"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Restaurante Cabana Gabriela",
                "description": "Moqueca baiana tradicional e pratos típicos da região.",
                "lat": -14.7951,
                "lng": -39.0443,
                "layer_id": "restaurants"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Sabor da Terra",
                "description": "Comida caseira baiana com tempero especial e acarajé delicioso.",
                "lat": -14.7905,
                "lng": -39.0511,
                "layer_id": "restaurants"
            },
            
            # Hotels
            {
                "id": str(uuid.uuid4()),
                "name": "Hotel Jardim Atlântico",
                "description": "Hotel resort à beira-mar com piscinas, spa e restaurante.",
                "lat": -14.8127,
                "lng": -39.0331,
                "layer_id": "hotels"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pousada Vila das Pedras",
                "description": "Pousada charmosa com arquitetura colonial e café da manhã regional.",
                "lat": -14.7891,
                "lng": -39.0489,
                "layer_id": "hotels"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Ilhéus Praia Hotel",
                "description": "Hotel moderno no centro histórico com vista para a Catedral.",
                "lat": -14.7915,
                "lng": -39.0485,
                "layer_id": "hotels"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Cana Brava Resort",
                "description": "Resort all-inclusive com praia particular e atividades aquáticas.",
                "lat": -14.8234,
                "lng": -39.0289,
                "layer_id": "hotels"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pousada dos Hibiscos",
                "description": "Pousada boutique com jardim tropical e atendimento personalizado.",
                "lat": -14.7967,
                "lng": -39.0401,
                "layer_id": "hotels"
            },
            
            # Tourist Sights
            {
                "id": str(uuid.uuid4()),
                "name": "Casa de Jorge Amado",
                "description": "Museu dedicado ao escritor Jorge Amado com acervo pessoal.",
                "lat": -14.7919,
                "lng": -39.0476,
                "layer_id": "tourist_sights"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Catedral de São Sebastião",
                "description": "Igreja histórica do século XVI com arquitetura colonial.",
                "lat": -14.7928,
                "lng": -39.0481,
                "layer_id": "tourist_sights"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Bataclan (Casa de Gabriela)",
                "description": "Cenário do romance Gabriela Cravo e Canela, bar icônico.",
                "lat": -14.7921,
                "lng": -39.0479,
                "layer_id": "tourist_sights"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Praia dos Milionários",
                "description": "Praia urbana famosa com orla arborizada e quiosques.",
                "lat": -14.7983,
                "lng": -39.0393,
                "layer_id": "tourist_sights"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Fazenda Yrerê (Fazenda de Cacau)",
                "description": "Fazenda histórica de cacau com tour pela plantação.",
                "lat": -14.8456,
                "lng": -39.0723,
                "layer_id": "tourist_sights"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Teatro Municipal de Ilhéus",
                "description": "Teatro centenário com apresentações culturais e shows.",
                "lat": -14.7925,
                "lng": -39.0483,
                "layer_id": "tourist_sights"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Praia do Cristo",
                "description": "Praia com Cristo Redentor e mirante com vista panorâmica.",
                "lat": -14.8056,
                "lng": -39.0341,
                "layer_id": "tourist_sights"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Porto de Ilhéus",
                "description": "Porto histórico do ciclo do cacau, belo pôr do sol.",
                "lat": -14.7897,
                "lng": -39.0493,
                "layer_id": "tourist_sights"
            },
            
            # Beaches
            {
                "id": str(uuid.uuid4()),
                "name": "Praia dos Milionários",
                "description": "Praia urbana mais famosa de Ilhéus, com quiosques e ótima infraestrutura.",
                "lat": -14.7995,
                "lng": -39.0385,
                "layer_id": "beaches"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Praia do Cristo",
                "description": "Praia tranquila com águas calmas, ideal para famílias.",
                "lat": -14.8045,
                "lng": -39.0351,
                "layer_id": "beaches"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Praia do Sul",
                "description": "Praia extensa com areias claras e coqueirais.",
                "lat": -14.8156,
                "lng": -39.0298,
                "layer_id": "beaches"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Praia dos Coqueiros",
                "description": "Praia cercada por coqueiros, ótima para caminhadas.",
                "lat": -14.8089,
                "lng": -39.0321,
                "layer_id": "beaches"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Praia do Marciano",
                "description": "Praia rústica e preservada, perfeita para relaxar.",
                "lat": -14.7823,
                "lng": -39.0512,
                "layer_id": "beaches"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Praia da Concha",
                "description": "Praia protegida com mar calmo, ideal para banho.",
                "lat": -14.7878,
                "lng": -39.0468,
                "layer_id": "beaches"
            }
        ]
        
        await db.layers.insert_many(layers)
        await db.markers.insert_many(markers)
        
        logger.info(f"Seeded {len(layers)} layers and {len(markers)} markers")
    else:
        # Check if beaches layer exists, if not add it
        beaches_layer = await db.layers.find_one({"id": "beaches"})
        if not beaches_layer:
            logger.info("Adding beaches layer to existing data...")
            new_layer = {
                "id": "beaches",
                "name": "Praias",
                "color": "#6EC1E4",
                "icon": "beach_access",
                "visible": True
            }
            await db.layers.insert_one(new_layer)
            
            # Add beach markers
            beach_markers = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Praia dos Milionários",
                    "description": "Praia urbana mais famosa de Ilhéus, com quiosques e ótima infraestrutura.",
                    "lat": -14.7995,
                    "lng": -39.0385,
                    "layer_id": "beaches"
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Praia do Cristo",
                    "description": "Praia tranquila com águas calmas, ideal para famílias.",
                    "lat": -14.8045,
                    "lng": -39.0351,
                    "layer_id": "beaches"
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Praia do Sul",
                    "description": "Praia extensa com areias claras e coqueirais.",
                    "lat": -14.8156,
                    "lng": -39.0298,
                    "layer_id": "beaches"
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Praia dos Coqueiros",
                    "description": "Praia cercada por coqueiros, ótima para caminhadas.",
                    "lat": -14.8089,
                    "lng": -39.0321,
                    "layer_id": "beaches"
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Praia do Marciano",
                    "description": "Praia rústica e preservada, perfeita para relaxar.",
                    "lat": -14.7823,
                    "lng": -39.0512,
                    "layer_id": "beaches"
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Praia da Concha",
                    "description": "Praia protegida com mar calmo, ideal para banho.",
                    "lat": -14.7878,
                    "lng": -39.0468,
                    "layer_id": "beaches"
                }
            ]
            await db.markers.insert_many(beach_markers)
            logger.info(f"Added beaches layer with {len(beach_markers)} markers")
        else:
            logger.info("Database already contains beaches layer")